const url = require('url');
const arch = require('./arch');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';

const ssr
	= async (host, pathname, query) => {
		const url = `http://${host}/${pathname.substring(1)}/index.html${query ? `${query}` : ''}`;
		const browser = await puppeteer.launch({headless: true});
		const page = await browser.newPage();
		await page.goto(url, {waitUntil: 'networkidle0'});
		const html = await page.content();
		await browser.close();
		console.log('[ssr]', ['Server Side Rendering via Puppeteer']);
		return html;
	};

const routing = {
	'users': (req, res, callback) => {
		const urlObject = url.parse(req.url, true);
		const host = req.headers.host;
		const pathname = urlObject.pathname;
		const query = urlObject.search;
		ssr(host, pathname, query)
			.then(html => callback(html))
			.catch(err => console.dir({err}));
	},
};

const server = arch({routing});

server
	.listen(PORT, HOST, () => {
		console.log('[arch]', [`server listening on http://${HOST}:${PORT}`]);
	});
