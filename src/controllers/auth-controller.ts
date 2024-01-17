import { type NextFunction, type Request, type Response } from 'express'
import UtilsError, { catchAsync } from '../util/app-error'
import type AccessToken from '../util/token'
import { type Payload } from '../util/token'
import type AuthServices from '../services/auth-services'
import { generateToken } from '../util'
import { type emailParams } from '../types'
import { tokenResetDataStore } from '../store'
import { logger } from '../app'
import newServices from '../services/news-services'

export interface signinParams {
  email: string
  password: string
}

export interface userParams {
  username: string
  email: string
  lastName: string
  firstName: string
  gender?: string
  password: string
  confirmPassword: string
  profile?: string
  phone: string
  nationalID: number
  nationality?: string
  profession?: string
  dob?: Date
}

class AuthController {
  constructor (private readonly _authServices: AuthServices, private readonly _accessToken: AccessToken) {}

  authSignupHandler = catchAsync(
    async (
      req: Request<any, any, userParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const data: userParams = req.body
      const user = await this._authServices.signup(data)

      const activationToken = await generateToken()
      const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/users/verify/${activationToken}`

      const payload: Payload = { email: user.email }
      const emailPayload: emailParams = {
        ...payload,
        subject: 'verify your account',
        message: `${verifyURL}`
      }

      logger.warn(emailPayload)
      const timestamp = Math.floor(Date.now() / 1000) + (30 * 60)

      // await mailTransporter(emailPayload.email, emailPayload.message, emailPayload.subject)
      await tokenResetDataStore(user.id, activationToken, timestamp)
      const token: string = await this._accessToken.createAccessToken(payload)

      res.status(201).json({
        status: 'created',
        token,
        data: {
          user
        }
      })
    }
  )

  authSigninHandler = catchAsync(
    async (
      req: Request<any, any, signinParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const data: signinParams = req.body

      const user = await this._authServices.signin(data)

      const isValid: boolean = await user.decryptPassword(
        data.password,
        user.password
      )
      if (!isValid) throw new UtilsError('invalid email or password', 400)
      const payload: Payload = { email: user.email }
      const token: string = await this._accessToken.createAccessToken(payload)

      await newServices()
      res.status(200).json({
        status: 'Ok',
        token,
        message: 'signed in successfully'
      })
    }
  )
}

export default AuthController
