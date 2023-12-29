import { type Request, type Response, type NextFunction } from 'express'
import UtilsError, { catchAsync } from '../utils/app-error'
import userModel from '../models/user-model'
import type AccessToken from '../utils/token'
import { logger } from '../app'

/**
 * @summary
 * get the token from the header
 * validate the token
 * authorize the user
 */
class AuthMiddleware {
  constructor (private readonly _createToken: AccessToken) {}

  authMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization: string = req.headers.authorization as string
    if (authorization === undefined) {
      throw new UtilsError('authorization header invalid', 401)
    }
    const fields: string[] = authorization?.split(' ')

    if (fields.length !== 2) {
      throw new UtilsError('authorization header invalid', 401)
    }
    if (fields[0].toLowerCase() !== 'bearer') {
      throw new UtilsError('authorization type not implemented', 401)
    }

    const token: string = fields[1]
    const decode = await this._createToken.verifyAccessToken(token)

    if (decode === undefined) throw new UtilsError('invalid access token', 401)
    const user = await userModel
      .findOne({ email: decode?.email })
      .populate({ path: 'password', select: true })
    const isPasswordChanged = await user?.verifyPasswordChange(
      decode?.iat as number
    )

    if (user === null || isPasswordChanged === true) {
      throw new UtilsError('invalid user or password', 401)
    }

    if (user?.isActive === false) {
      throw new UtilsError('verify your account', 401)
    }

    req.user = user
    next()
  })

  restrictResourceTo = (...args: string[]): any => {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!args.includes(req.user.role)) {
          throw new UtilsError('user forbiden to access this resource', 403)
        }
        next()
      }
    )
  }

  protectResource = (...args: string[]): any => {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        logger.warn(req.params.id !== req.user.id)
        if (req.params.id !== req.user.id && !args.includes(req.user.role)) {
          throw new UtilsError('user forbiden to access this resource', 403)
        }
        next()
      }
    )
  }
}

export default AuthMiddleware
