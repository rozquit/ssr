const puppeteer = require('puppeteer');

const RENDER_CACHE = new Map();

let browserWSEndpoint = null;

const clearCache = () => {
	RENDER_CACHE.clear();
	console.log('[ssr | prerender]', ['cache has been cleared']);
};

const ssr
	= async (host, pathname, query) => {
	if (!browserWSEndpoint) {
		const browser = await puppeteer.launch();
		browserWSEndpoint = await browser.wsEndpoint();
	}
	
	console.info('[ssr | browserWSEndpoint]', `'${browserWSEndpoint}'`);

	const url = `http://${host}/${pathname.substring(1) ? `${pathname.substring(1)}/index.html` : 'index.html'}${query ? `${query}` : ''}`;
	
	if (RENDER_CACHE.has(url)) {
		return {html: RENDER_CACHE.get(url), ttRenderMs: 0};
	}
	
	const start = Date.now();
	const browser = await puppeteer.connect({browserWSEndpoint});
	const page = await browser.newPage();
	await page.setRequestInterception(true);
	
	page.on('request', req => {
		const allowList = ['document', 'script', 'xhr', 'fetch'];
		if (!allowList.includes(req.resourceType())) return req.abort();
		req.continue();
	});
	
	try {
		await page.goto(url, {waitUntil: 'networkidle0'});
		await page.waitForSelector('#container');
	} catch (err) {
		console.error(err);
		throw new Error('page.goto/waitForSelector timed out.');
	}
	
	const html = await page.content();
	
	await page.close();
	
	const ttRenderMs = Date.now() - start;
	console.info('[ssr | headless]', ['rendered page in:', ttRenderMs, 'ms']);
	
	RENDER_CACHE.set(url, html);
	
	return {html, ttRenderMs};
};

module.exports = {ssr, clearCache};
