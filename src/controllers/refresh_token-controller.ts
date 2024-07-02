import { type Request, type Response, type NextFunction } from 'express'

import { IUser } from '../models/user-model'
import AppError from '../util/app-error'
import SessionServices from '../services/session-services'
import { catchAsync } from '../util/app-error'
import AccessToken from '../util/token'

class RefreshToken {
  constructor(
    private readonly _sessionServices: SessionServices,
    private readonly _accessToken: AccessToken
  ) {}

  updateRefreshToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // NOTE: you got to be a logged-in user to request
      // for a refresh token renewal
      const user = req.user as IUser
      if (!user) {
        next(new AppError('please login or signup', 401))
        return
      }

      // TODO: Fetch refresh token based on the USER ID
      const payload = await this._sessionServices.fetchRefreshToken(user._id)
      if (!payload) {
        next(new AppError('please login or signup', 401))
        return
      }
      const decode = await this._accessToken.verifyAccessToken(payload.token)
      if (!decode) {
        next(new AppError('please login or signup', 401))
        return
      }
      console.log(decode)

      res.status(200).json({
        status: 'success'
      })
    }
  )
}

export default RefreshToken
