const url = require('url');
const arch = require('./arch');
const {ssr, clearCache} = require('./lib/ssr');
const Scheduler = require('./lib/scheduler');
const scheduler = new Scheduler();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';

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

const routing = {
	'users': routeHandler,
};

scheduler.setTask('prerender', {
	interval: 30 * 1000,
	run: (task, callback) => {
		clearCache();
		Promise.all([
			ssr(`${HOST}:${PORT}`, '/users', false),
		]).then(() => callback(null)).catch(err => callback(err));
	}
});

const server = arch({routing});

server
	.listen(PORT, HOST, () => {
		console.log('[arch]', [`server listening on http://${HOST}:${PORT}`]);
	});
