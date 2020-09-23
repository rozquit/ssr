const arch = require('./arch')
const { HOST, PORT } = require('./config')

const options = {
  logger: true,
  prerender: {
  	repeat: 30 * 1000,
  	pages: ['/', '/users']
  }
}

const server = arch(options)

server.listen(PORT, HOST, () => {
  console.log('[arch]', `server listening on http://${HOST}:${PORT}`)
})
