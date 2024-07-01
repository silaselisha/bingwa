import { type NextFunction, type Request, type Response } from 'express'
import UtilsError, { catchAsync } from '../util/app-error'
import type AccessToken from '../util/token'
import { type Payload } from '../util/token'
import type AuthServices from '../services/auth-services'
import type SessionServices from '../services/session-services'
import { generateToken, mailTransporter } from '../util'
import { type UserParams, type EmailParams, type SigningParams } from '../types'
import { tokenDataStore } from '../store'
import SessionService from '../services/session-services'

class AuthController {
  constructor(
    private readonly _authServices: AuthServices,
    private readonly _sessionServices: SessionServices,
    private readonly _accessToken: AccessToken
  ) {}
  //BUG: when user verify their account they should be able to access
  //their accounts without a forceful re-login
  authSignupHandler = catchAsync(
    async (
      req: Request<any, any, UserParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const data: UserParams = req.body
      const user = await this._authServices.signup(data)

      const activationToken = await generateToken()
      const verifyURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/verify/${activationToken}`

      const payload: Payload = { id: user._id, email: user.email }
      const emailPayload: EmailParams = {
        ...payload,
        subject: 'verify your account',
        message: `${verifyURL}`
      }

      const timestamp = Math.floor(Date.now() / 1000) + 30 * 60

      await mailTransporter(
        emailPayload.email,
        emailPayload.message,
        emailPayload.subject
      )
      await tokenDataStore(user.id, activationToken, timestamp)

      res.status(201).json({
        status: 'created'
      })
    }
  )

  authSigninHandler = catchAsync(
    async (
      req: Request<any, any, SigningParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const data: SigningParams = req.body

      const user = await this._authServices.signing(data)

      const isValid: boolean = await user.decryptPassword(
        data.password,
        user.password
      )
      if (!isValid) throw new UtilsError('invalid email or password', 400)
      const payload: Payload = { id: user._id, email: user.email }
      const token: string = await this._accessToken.createAccessToken(
        payload,
        process.env.JWT_EXPIRES_IN as string
      )

      const refreshToken = await this._sessionServices.generateRefreshToken(
        req,
        payload
      )
 
      res.status(200).json({
        status: 'Ok',
        token,
        refreshToken,
        message: 'signed in successfully'
      })
    }
  )
}

export default AuthController
