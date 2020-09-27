'use strict'

const files = ['/', '/app.css', '/app.js', '/favicon.ico', '/favicon.png', '/manifest.json', '/icon.png', '/icon.svg']

// eslint-disable-next-line no-undef
self.addEventListener('install', event => event.waitUntil(caches.open('v1').then(cache => cache.addAll(files))))

// eslint-disable-next-line no-undef
self.addEventListener('fetch', event => {
  event.respondWith(
    // eslint-disable-next-line no-undef
    caches.match(event.request).then(response => {
      if (response !== undefined) return response
      // eslint-disable-next-line no-undef
      return fetch(event.request)
        .then(response => {
          const responseClone = response.clone()
          // eslint-disable-next-line no-undef
          caches.open('v1').then(cache => {
            if (event.request.method === 'POST') return
            return cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(error => {
          throw error
        })
    })
  )
})
