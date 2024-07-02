import { type Request, type Response, type NextFunction } from 'express'

import { IUser } from '../models/user-model'
import UtilsError from '../util/app-error'
import SessionServices from '../services/session-services'
import { catchAsync } from '../util/app-error'
import AccessToken, { Payload } from '../util/token'

class RefreshToken {
  constructor(
    private readonly _sessionServices: SessionServices,
    private readonly _accessToken: AccessToken
  ) {}

  updateRefreshToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const user = req.user as IUser
      if (!user) {
        throw new UtilsError('please login or signup', 401)
      }

      const session = await this._sessionServices.fetchRefreshToken(user._id)
      if (!session) {
        throw new UtilsError('please login or signup', 401)
      }

      const decode = await this._accessToken.verifyAccessToken(session.token)
      if (!decode) {
        throw new UtilsError('please login or signup', 401)
      }

      const payload: Payload = {
        email: user.email,
        id: user._id
      }
      const token = await this._accessToken.createAccessToken(
        payload,
        process.env.JWT_RFT_EXPIRES_IN as string
      )

      session.token = token
      session.save({ validateBeforeSave: false })

      res.status(200).json({
        status: 'success',
        refreshToken: token
      })
    }
  )
}

export default RefreshToken
