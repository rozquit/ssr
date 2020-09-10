'use strict';

const files = [
	'/',
	'/app.css',
	'/app.js',
	// '/favicon.ico',
	// '/favicon.png',
	// '/manifest.json',
	// '/arch.png',
	// '/arch.svg',
];

self.addEventListener('install', event => event.waitUntil(
	caches.open('v1').then(cache => cache.addAll(files))
));

self.addEventListener('fetch', event => {
	event.respondWith(caches.match(event.request).then(response => {
		if (response !== undefined) return response;
		return fetch(event.request).then(response => {
			const responseClone = response.clone();
			caches.open('v1').then(cache => {
				if (event.request.method === 'POST') return;
				return cache.put(event.request, responseClone);
			});
			return response;
		}).catch(error => {
			throw error;
		});
	}));
});
