'use strict';

const API_PATH = './api';
const HOME = 'users';

const registerServiceWorker = () => {
	if (!Reflect.has(navigator, 'serviceWorker')) {
		console.log('Service workers are not supported');
		return;
	}
	const { serviceWorker } = navigator;
	serviceWorker.register('/sw.js').then(registration => {
		if (registration.installing) {
			console.log('Service worker installing');
			console.log(registration.installing);
			return;
		}
		if (registration.waiting) {
			console.log('Service worker installed');
			console.log(registration.waiting);
			return;
		}
		if (registration.active) {
			console.log('Service worker active');
			console.log(registration.active);
			return;
		}
	}).catch(error => {
		console.log('Registration failed');
		console.log(error);
	});
};

const parseLocation
	= location => {
	const params = new URLSearchParams(location);
	const obj = {};
	for (const key of params.keys()) {
		if (params.getAll(key).length > 1) {
			obj[key] = params.getAll(key);
		} else {
			obj[key] = params.get(key);
		}
	}
	return obj;
};

const renderUsers
	= (users, container) => {
		const html = users.reduce((html, user) => {
			return `${html}
		      <li class="user">
		        <h2>${user.name}</h2>
		        <p><code>${user.role}</code></p>
		        <p>${user.email}</p>
		        <p><code>${user.isActive}</code></p>
		      </li>`;
		}, '');
		container.innerHTML = `<ul id="users">${html}</ul>`;
	};

const renderNotFound
	= container =>
	container.innerHTML
		= `<section id="notfound">404 Not Found</section>`;


const routing = (route, data, container) => {
	switch (route) {
		case '/':
			renderUsers(data, container);
			break
		case '/users':
			renderUsers(data, container);
			break;
		default:
			renderNotFound(container);
	}
};

const ssr = async () => {
	const location = parseLocation(window.location);
	const pathname = location.pathname
	const isRoot = pathname === '/' || pathname.substring(1) === 'index.html';
	const container = document.querySelector('#container');
	const PRE_RENDERED = isRoot ? null : container.querySelector(`#${pathname.substring(1).replace('/', '')}`);
	if(!PRE_RENDERED) {
		const data = await fetch(`/${API_PATH.substring(2)}/${isRoot ? HOME : `${pathname.substring(1)}`}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({location}),
		}).then(resp => resp.json());
		routing(pathname, data, container);
	}
};

window.addEventListener('load', () => {
	registerServiceWorker();
	ssr().catch(err => console.dir({err}));
});

window.addEventListener('beforeinstallprompt', event => {
	console.log('Installing PWA');
	console.dir({beforeinstallprompt: event});
});

window.addEventListener('appinstalled', event => {
	console.log('PWA installed');
	console.dir({appinstalled: event});
});

