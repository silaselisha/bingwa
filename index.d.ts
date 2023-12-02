declare global {
  namespace Express {
    interface Request {
      context?: any
    }
  }
}
