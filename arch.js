'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const {ssr, prerender} = require('./utils/ssr');

const STATIC = process.env.STATIC || 'static';
const API = process.env.API || 'api';

const STATIC_PATH = path.join(process.cwd(), `./${STATIC}`);
const API_PATH = `./${API}`;

const MIME_TYPES = {
	html: 'text/html; charset=UTF-8',
	js: 'application/javascript; charset=UTF-8',
	css: 'text/css',
	png: 'image/png',
	ico: 'image/x-icon',
	json: 'application/json',
	svg: 'image/svg+xml',
};

const api = new Map();

const routeHandler
	= (req, res, callback) => {
		const urlObject = url.parse(req.url, true);
		const host = req.headers.host;
		const pathname = urlObject.pathname;
		const query = urlObject.search;
		ssr(host, pathname, query)
			.then(({html, ttRenderMs}) => {
				res.writeHead(200, {'Server-Timing': `Prerender;dur=${ttRenderMs};desc="Headless render time (ms)"`});
				callback(html);
			})
			.catch(err => console.dir({err}));
	};

const types = {
	object: ([data], callback) => callback(JSON.stringify(data)),
	undefined: (args, callback) => callback('Not Found'),
	function: ([fn, req, res], callback) => {
		if (fn.length === 3) fn(req, res, callback);
		else callback(JSON.stringify(fn(req, res)));
	},
};

const serve
	= (data, req, res) => {
		const type = typeof data;
		if (type === 'string') return res.end(data);
		const serializer = types[type];
		serializer([data, req, res], data => serve(data, req, res));
	};

const serveFile
	= name => {
		const filePath = path.join(STATIC_PATH, name);
		if (!filePath.startsWith(STATIC_PATH)) return null;
		return fs.createReadStream(filePath);
	};

const receiveArgs
	= async req =>
	new Promise((resolve, reject) => {
		const body = [];
		req
			.on('data', chunk => {
				body.push(chunk);
			})
			.on('end', async () => {
				const data = body.join(',');
				data
					? resolve(JSON.parse(data))
					: reject('Bad Request');
			});
	});

const cacheFile
	= name => {
		const filePath = `${API_PATH}/${name}`;
		const key = path.basename(filePath, '.js');
		try {
			const libPath = require.resolve(filePath);
			delete require.cache[libPath];
		} catch (e) {
			return;
		}
		try {
			const method = require(filePath);
			api.set(key, method);
		} catch (e) {
			api.delete(name);
		}
	};

const cacheFolder
	= path => {
		fs.readdir(path, (err, files) => {
			if (err) return;
			files.forEach(cacheFile);
		});
	};

const watch
	= path => {
		fs.watch(path, (event, file) => {
			cacheFile(file);
		});
	};

cacheFolder(API_PATH);
watch(API_PATH);

const httpError
	= (res, status, message) => {
		res.statusCode = status;
		res.end(`${message}`);
	};

const switchTo
	= type =>
	async (pathname, req, res) => {
		switch (type) {
			case API:
				const [endpoint] = pathname.substring(5).split('/');
				const method = api.get(endpoint);
				const args = await receiveArgs(req).catch(err => console.dir({err}));
				if (!args) return httpError(res, 400, 'Bad Request');
				try {
					const result = await method(args);
					if (!result) return httpError(res, 500, 'Server Error');
					res.end(JSON.stringify(result));
				} catch (err) {
					console.dir({err});
					httpError(res, 500, 'Server Error');
				}
				break;
			case STATIC:
				const file = path.basename(pathname);
				const fileExt = path.extname(file).substring(1);
				if (MIME_TYPES[fileExt]) {
					res.writeHead(200, {'Content-Type': MIME_TYPES[fileExt]});
					const stream = serveFile(file);
					if (stream) stream.pipe(res);
				} else {
					const route = pathname.substring(1);
					const data = api.has(route)
						? routeHandler
						: undefined;
					serve(data, req, res);
				}
				break;
		}
	}

const httpHandler
	= async (req, res) => {
		const urlString = req.url === '/' ? '/index.html' : req.url;
		const urlObject = url.parse(urlString, true);
		const pathname = urlObject.pathname;
		const query = urlObject.search;
		console.log('[httpHandler | pathname | query]', [pathname, query]);
		const apiRegExp = new RegExp(API);
		pathname.match(apiRegExp)
			? await switchTo(API)(pathname, req, res)
			: await switchTo(STATIC)(pathname, req, res);
	};

function arch(options) {
	options = options || {}
	if (typeof options !== 'object') {
		throw new TypeError('Options must be an object');
	}
	const pages = options.prerender.pages || [];
	if (pages.length) prerender(options);
	return http.createServer(async (req, res) => await httpHandler(req, res));
}

arch.arch = arch;
arch.default = arch;
module.exports = arch;
