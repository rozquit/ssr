const nullLogger = require('abstract-logging')
const pino = require('pino')
const { serializersSym } = pino.symbols

const createPinoLogger = (opts, stream) => {
  stream = stream || opts.stream
  delete opts.stream
  if (stream && opts.file) {
    throw new Error('Cannot specify both logger.stream and logger.file options')
  } else if (opts.file) {
    stream = pino.destination(opts.file)
    delete opts.file
  }
  const prevLogger = opts.logger
  const prevGenReqId = opts.genReqId
  let logger = null
  if (prevLogger) {
    opts.logger = undefined
    opts.genReqId = undefined
    if (prevLogger[serializersSym]) {
      opts.serializers = Object.assign({}, opts.serializers, prevLogger[serializersSym])
    }
    logger = prevLogger.child(opts)
    opts.logger = prevLogger
    opts.genReqId = prevGenReqId
  } else {
    logger = pino(opts, stream)
  }
  return logger
}

const serializers = {
  req: function asReqValue (req) {
    return {
      method: req.method,
      url: req.url,
      version: req.headers['accept-version'],
      hostname: req.hostname,
      remoteAddress: req.ip,
      remotePort: req.connection.remotePort
    }
  },
  err: pino.stdSerializers.err,
  res: function asResValue (res) {
    return {
      statusCode: res.statusCode
    }
  }
}

const now = () => {
  const ts = process.hrtime()
  return ts[0] * 1e3 + ts[1] / 1e6
}

const createLogger = options => {
  if (isValidLogger(options.logger)) {
    const logger = createPinoLogger({
      logger: options.logger,
      serializers: Object.assign({}, serializers, options.logger.serializers)
    })
    return { logger, hasLogger: true }
  } else if (!options.logger) {
    const logger = nullLogger
    logger.child = () => logger
    return { logger, hasLogger: false }
  } else {
    const localLoggerOptions = {}
    if (Object.prototype.toString.call(options.logger) === '[object Object]') {
      Reflect.ownKeys(options.logger).forEach(prop => {
        Object.defineProperty(localLoggerOptions, prop, {
          value: options.logger[prop],
          writable: true,
          enumerable: true,
          configurable: true
        })
      })
    }
    localLoggerOptions.level = localLoggerOptions.level || 'info'
    localLoggerOptions.serializers = Object.assign({}, serializers, localLoggerOptions.serializers)
    options.logger = localLoggerOptions
    const logger = createPinoLogger(options.logger)
    return { logger, hasLogger: true }
  }
}

const isValidLogger = logger => {
  if (!logger) return false
  let result = true
  const methods = ['info', 'error', 'debug', 'fatal', 'warn', 'trace', 'child']
  for (let i = 0; i < methods.length; i += 1) {
    if (!logger[methods[i]] || typeof logger[methods[i]] !== 'function') {
      result = false
      break
    }
  }
  return result
}

module.exports = {
  createLogger,
  serializers,
  now
}
