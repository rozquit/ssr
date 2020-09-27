'use strict'

const API = 'api'
const HOME = 'users'

const registerServiceWorker = () => {
  if (!Reflect.has(navigator, 'serviceWorker')) {
    console.log('Service workers are not supported')
    return
  }
  const { serviceWorker } = navigator
  serviceWorker
    .register('/sw.js')
    .then(registration => {
      if (registration.installing) {
        console.log('Service worker installing')
        console.log(registration.installing)
        return
      }
      if (registration.waiting) {
        console.log('Service worker installed')
        console.log(registration.waiting)
        return
      }
      if (registration.active) {
        console.log('Service worker active')
        console.log(registration.active)
      }
    })
    .catch(error => {
      console.log('Registration failed')
      console.log(error)
    })
}

const parseLocation = location => {
  const params = new URLSearchParams(location)
  const obj = {}
  for (const key of params.keys()) {
    if (params.getAll(key).length > 1) {
      obj[key] = params.getAll(key)
    } else {
      obj[key] = params.get(key)
    }
  }
  return obj
}

const renderUsers = (users, container) => {
  const html = users.reduce((html, user, index) => {
    return `${html}
        <dl>
          <dt>${user.name}</dt>
          <dd>${user.role}</dd>
          <dd>${user.email}</dd>
          <dd>${user.isActive}</dd>
          <dd>${index}</dd>
        </dl>`
  }, '')
  container.innerHTML = `<section id="users">${html}</section>`
}

const renderNotFound = container => (container.innerHTML = '<section id="notfound">404 Not Found</section>')

const routing = (route, data, container) => {
  switch (true) {
    case /^\/$|^\/index\.html/.test(route):
      renderUsers(data, container)
      break
    case /^\/users$|^\/users\/$|^\/users\/index.html$/.test(route):
      renderUsers(data, container)
      break
    default:
      renderNotFound(container)
  }
}

const ssr = async () => {
  const location = parseLocation(window.location)
  const pathname = location.pathname
  const isRoot = pathname === '/' || pathname.substring(1) === 'index.html'
  const container = document.querySelector('#container')
  const PRE_RENDERED = isRoot ? null : container.querySelector(`#${pathname.substring(1).replace('/', '')}`)
  if (!PRE_RENDERED) {
    // eslint-disable-next-line no-undef
    const data = await fetch(`/${API}/${isRoot ? HOME : `${pathname.substring(1)}`}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ location })
    }).then(resp => resp.json())
    routing(pathname, data, container)
  }
}

window.addEventListener('load', () => {
  registerServiceWorker()
  ssr().catch(err => console.dir({ err }))
})

window.addEventListener('beforeinstallprompt', event => {
  console.log('Installing PWA')
  console.dir({ beforeinstallprompt: event })
})

window.addEventListener('appinstalled', event => {
  console.log('PWA installed')
  console.dir({ appinstalled: event })
})
