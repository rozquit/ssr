'use strict'

const fs = require('fs')
const http = require('http')
const path = require('path')
const URL = require('url').URL
const { STATIC, API } = require('./config')
const { createLogger } = require('./lib/logger')
const { prerender, ssr } = require('./utils/ssr')

const STATIC_PATH = path.join(process.cwd(), `./${STATIC}`)
const API_PATH = `./${API}`

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  json: 'application/json',
  svg: 'image/svg+xml'
}

const api = new Map()

const types = {
  object: ([data], callback) => callback(JSON.stringify(data)),
  // eslint-disable-next-line standard/no-callback-literal
  undefined: (args, callback) => callback('Not Found'),
  function: ([fn, req, res], callback) => {
    if (fn.length === 3) fn(req, res, callback)
    else callback(JSON.stringify(fn(req, res)))
  }
}

const serve = (data, req, res) => {
  const type = typeof data
  if (type === 'string') return res.end(data)
  const serializer = types[type]
  serializer([data, req, res], data => serve(data, req, res))
}

const serveFile = name => {
  const filePath = path.join(STATIC_PATH, name)
  if (!filePath.startsWith(STATIC_PATH)) return null
  return fs.createReadStream(filePath)
}

const receiveArgs = async req =>
  new Promise((resolve, reject) => {
    const body = []
    req
      .on('data', chunk => {
        body.push(chunk)
      })
      .on('end', async () => {
        const data = body.join(',')
        data ? resolve(JSON.parse(data)) : reject(new Error('Bad Request'))
      })
  })

const cacheFile = name => {
  const filePath = `${API_PATH}/${name}`
  const key = path.basename(filePath, '.js')
  try {
    const libPath = require.resolve(filePath)
    delete require.cache[libPath]
  } catch (e) {
    return
  }
  try {
    const method = require(filePath)
    api.set(key, method)
  } catch (e) {
    api.delete(name)
  }
}

const cacheFolder = path => {
  fs.readdir(path, (err, files) => {
    if (err) return
    files.forEach(cacheFile)
  })
}

const watch = path => {
  fs.watch(path, (event, file) => {
    cacheFile(file)
  })
}

cacheFolder(API_PATH)
watch(API_PATH)

const httpError = (res, status, message) => {
  res.statusCode = status
  res.end(`${message}`)
}

const routeHandler = (req, res, callback) => {
  const host = req.headers.host
  const urlObject = new URL(req.url, `http://${host}`)
  const pathname = urlObject.pathname
  const query = urlObject.search
  ssr(host, pathname, query)
    .then(({ html, ttRenderMs }) => {
      res.writeHead(200, { 'Server-Timing': `Prerender;dur=${ttRenderMs};desc="Headless render time (ms)"` })
      callback(html)
    })
    .catch(err => console.error(err))
}

const staticHandler = async ({ pathname, query }, req, res) => {
  const file = path.basename(pathname)
  const fileExt = path.extname(file).substring(1)
  if (MIME_TYPES[fileExt]) {
    res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] })
    const stream = serveFile(file)
    if (stream) stream.pipe(res)
  } else {
    const route = pathname.substring(1).replace(/\//, '')
    const data = api.has(route) ? routeHandler : undefined
    serve(data, req, res)
  }
}

const apiHandler = async ({ pathname, query }, req, res) => {
  const [endpoint] = pathname.substring(5).split('/')
  const method = api.get(endpoint)
  const args = await receiveArgs(req).catch(err => console.error(err))
  if (!args || query) return httpError(res, 400, 'Bad Request')
  try {
    const result = await method(args)
    if (!result) return httpError(res, 500, 'Server Error')
    res.end(JSON.stringify(result))
  } catch (err) {
    httpError(res, 500, 'Server Error')
  }
}

const httpHandler = logger => async (req, res) => {
  const urlString = req.url === '/' ? '/index.html' : req.url
  const urlObject = new URL(urlString, `http://${req.headers.host}`)
  const pathname = urlObject.pathname
  const query = urlObject.search
  logger.info({ pathname, query })
  const apiRegExp = new RegExp(API)
  pathname.match(apiRegExp)
    ? await apiHandler({ pathname, query }, req, res)
    : await staticHandler({ pathname, query }, req, res)
}

function server (options) {
  options = options || {}
  if (typeof options !== 'object') {
    throw new TypeError('Options must be an object')
  }
  options.prerender = options.prerender || {}
  options.prerender.pages = options.prerender.pages || []
  const pages = options.prerender.pages
  if (pages.length) prerender(options)
  const { logger } = createLogger(options)
  return http.createServer(httpHandler(logger))
}

server.server = server
server.default = server
module.exports = server
