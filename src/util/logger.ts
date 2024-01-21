import winston from 'winston'

abstract class Logger {
  static winston = (level: string, filename: string): winston.Logger => {
    const instance = process.env.NODE_ENV === 'development' ? 
    winston.createLogger({
      level,
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        }),
        new winston.transports.File({ filename })
      ]
    }) : winston.createLogger({
      level,
      transports: [
        new winston.transports.File({ filename })
      ]
    })
    return instance
  }
}

export default Logger
