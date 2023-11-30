class UtilsError extends Error {
  public statusCode: number
  public isOperational: boolean
  public status: string
  constructor (message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.status = `${this.statusCode}`.startsWith('5') ? 'internal server error' : 'bad request'

    Error.captureStackTrace(this, this.constructor)
  }
}

export default UtilsError
