const arch = require('./arch');
const {ssr, clearCache} = require('./utils/ssr');
const Scheduler = require('./lib/scheduler');
const scheduler = new Scheduler();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 8080;

const options = {
	routes: {
		'users': {},
	},
}

scheduler.setTask(`prerender`, {
	repeat: 30 * 1000,
	run: (task, callback) => {
		clearCache();
		Promise.all([
			ssr(`${HOST}:${PORT}`, '/', false),
			ssr(`${HOST}:${PORT}`, '/users', false),
		])
		.then(() => callback(null))
		.then(() => scheduler.setTask(`prerender`, task))
		.catch(err => {
			callback(err);
			scheduler.stopTask(`prerender`);
		});
	}
});

const server = arch(options);

server.listen(PORT, HOST, () => {
	console.log('[arch]', [`server listening on http://${HOST}:${PORT}`]);
});
