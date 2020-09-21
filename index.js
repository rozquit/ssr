const arch = require('./arch');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 8080;

const options = {
	host: HOST,
	port: PORT,
	prerender: {
		repeat: 30 * 1000,
		pages: ['/', '/users'],
	},
};

const server = arch(options);

server.listen(Number(options.port), options.host, () => {
	console.log('[arch]', [`server listening on http://${options.host}:${options.port}`]);
});
