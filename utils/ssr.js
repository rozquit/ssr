const puppeteer = require('puppeteer')
const Scheduler = require('../lib/scheduler')
const { HOST, PORT } = require('../config')

const scheduler = new Scheduler()

const RENDER_CACHE = new Map()

let browserWSEndpoint = null

const clearCache = () => {
  RENDER_CACHE.clear()
}

const ssr = async (host, pathname, query) => {
  if (!browserWSEndpoint) {
    const browser = await puppeteer.launch()
    browserWSEndpoint = await browser.wsEndpoint()
  }

  const url = `http://${host}/${pathname.substring(1) ? `${pathname.substring(1)}/index.html` : 'index.html'}${
    query ? `${query}` : ''
  }`

  if (RENDER_CACHE.has(url)) {
    return { html: RENDER_CACHE.get(url), ttRenderMs: 0 }
  }

  const start = Date.now()
  const browser = await puppeteer.connect({ browserWSEndpoint })
  const page = await browser.newPage()
  await page.setRequestInterception(true)

  page.on('request', req => {
    const allowList = ['document', 'script', 'xhr', 'fetch']
    if (!allowList.includes(req.resourceType())) return req.abort()
    req.continue()
  })

  try {
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.waitForSelector('#container')
  } catch (err) {
    throw new Error('page.goto/waitForSelector timed out.')
  }

  const html = await page.content()

  await page.close()

  const ttRenderMs = Date.now() - start

  RENDER_CACHE.set(url, html)

  return { html, ttRenderMs }
}

const prerender = ({ prerender: options }) => {
  const repeat = options.repeat
  const pages = options.pages
  scheduler.setTask('prerender', {
    repeat,
    run: (task, callback) => {
      clearCache()
      Promise.all(pages.map(page => ssr(`${HOST}:${PORT}`, page, null)))
        .then(() => callback(null))
        .then(() => scheduler.setTask('prerender', task))
        .catch(err => {
          callback(err)
          scheduler.stopTask('prerender')
        })
    }
  })
}

module.exports = {
  ssr,
  prerender
}
