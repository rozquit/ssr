const server = require('./server')
const { HOST, PORT } = require('./config')

const options = {
  logger: true,
  prerender: {
    repeat: 30 * 1000,
    pages: ['/', '/users']
  }
}

server(options).listen(PORT, HOST, () => {
  console.log('[server]', `listening on http://${HOST}:${PORT}`)
})
