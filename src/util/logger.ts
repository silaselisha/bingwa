import winston from 'winston'

const winstonLogger = (level: string, filename: string): winston.Logger => {
  const files = process.env.NODE_ENV === 'development'
    ? new winston.transports.Console({
      format: winston.format.simple()
    })
    : new winston.transports.File({ filename })

  const instance = winston.createLogger({
    level,
    transports: [
      files
    ]
  })
  return instance
}

export default winstonLogger
