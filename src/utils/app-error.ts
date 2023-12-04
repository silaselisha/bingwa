import { type NextFunction, type Request, type Response } from 'express'
import { type CustomError } from '../controllers/error-controller'

type AsyncMiddlewareFunc = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>

class UtilsError extends Error implements CustomError {
  public statusCode: number
  public isOperational: boolean
  public status: string
  public code?: number | undefined
  public keyValue?: any

  constructor (message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.status = `${this.statusCode}`.startsWith('5')
      ? 'internal server error'
      : 'bad request'

    Error.captureStackTrace(this, this.constructor)
  }
}

export const catchAsync = (fn: AsyncMiddlewareFunc): AsyncMiddlewareFunc => {
  return async (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: any) => {
      next(err)
    })
  }
}

export default UtilsError
