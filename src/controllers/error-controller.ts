import { type Request, type Response, type NextFunction } from 'express'
import UtilsError from '../util/app-error'
import { logger } from '../app'
import Logger from '../util/logger'
export interface CustomError {
  code?: number
  keyValue?: any
}

const handleClientError = (err: UtilsError, res: Response): void => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  })
}

const handleDeveloperError = (err: UtilsError, res: Response): void => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    err,
    stack: err.stack
  })
}

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = err as UtilsError
  error.statusCode = error.statusCode ?? 500
  error.status = error.status ?? 'internal server error'
  logger.warn(error.code)

  if (process.env.NODE_ENV?.startsWith('dev') ?? false) {
    handleDeveloperError(error, res)
  } else if (process.env.NODE_ENV?.startsWith('prod') ?? false) {
    let err = { ...error }

    if (err.code === 11000) {
      const [key, value] = Object.entries(err.keyValue)[0]
      err = new UtilsError(`${key} ${value as string} is taken`, 400)
    }
    if (err.name === 'TokenExpiredError') {
      err = new UtilsError(`${err?.message}`, 401)
    }
    if (err.name === 'JsonWebTokenError') {
      err = new UtilsError(`${err?.message}`, 401)
    }
    
    const log = Logger.winston('error', 'error.log')
    log.error(err)
    handleClientError(err, res)
  }
}

export default globalErrorHandler
