import { type Request, type Response, type NextFunction } from 'express'
import type UtilsError from '../utils/app-error'

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = err as UtilsError
  error.statusCode = error.statusCode ?? 500
  error.status = error.status ?? 'internal server error'

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    error,
    stack: error.stack
  })
}

export default globalErrorHandler
