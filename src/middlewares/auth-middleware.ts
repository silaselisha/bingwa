import { type Request, type Response, type NextFunction } from 'express'
import UtilsError, { catchAsync } from '../utils/app-error'
import userModel from '../models/user-model'
import { verifyAccessToken } from '../utils/token'

/**
 * @param req
 * @param res
 * @param next
 * @todo
 * get the token from the header
 * validate the token
 * authorize th user
 */
const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization: string = req.headers.authorization as string
    if (authorization === undefined) throw new UtilsError('authorization header invalid', 401)
    const fields: string[] = authorization?.split(' ')

    if (fields.length !== 2) {
      throw new UtilsError('authorization header invalid', 401)
    }
    if (fields[0].toLowerCase() !== 'bearer') {
      throw new UtilsError('authorization type not implemented', 401)
    }

    const token: string = fields[1]
    const decode = await verifyAccessToken(token)

    if (decode === undefined) throw new UtilsError('invalid access token', 401)
    const user = await userModel.findOne({ email: decode?.email })
    const isPasswordChanged = await user?.verifyPasswordChange(
      decode?.iat as number
    )

    if (user === null || isPasswordChanged === true) {
      throw new UtilsError('invalid user or password', 401)
    }

    req.user = user
    next()
  }
)

export default authMiddleware
