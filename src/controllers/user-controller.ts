import { type Request, type Response, type NextFunction } from 'express'
import {
  extractHeaderInfo,
  generateToken,
  imageProcessing,
  mailTransporter
} from '../util'
import type UserServices from '../services/user-services'
import UtilsError, { catchAsync } from '../util/app-error'
import { type IUser } from '../models/user-model'
import type AccessToken from '../util/token'
import { type Payload } from '../util/token'
import { tokenDataStore } from '../store'
import {
  type UpdateUserParams,
  type ActiveUserParams,
  type ResetPasswordParams,
  type PasswordParams,
  type ForgotPasswordParams,
  type EmailParams
} from '../types'

/**
 * @todo
 * user reset password functionality 🔥
 * forgot password 🔥
 * user activating account functionality (2FA & email activation) 🔥
 * push notification
 * user can have followers & user can follow other users (unfollow)
 */
export enum relationship {
  follow = 'follow',
  unfollow = 'unfollow'
}
class UserController {
  constructor(
    private readonly _userServices: UserServices,
    private readonly _createToken: AccessToken
  ) {}

  getAllUsersHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const queries = req.query
      const page = !Number.isNaN(queries.page) ? Number(queries.page) : 1
      const limit = !Number.isNaN(queries.limit) ? Number(queries.limit) : 3

      const users = await this._userServices.getUsers(page, limit)

      res.status(200).json({
        status: 'OK',
        records: users.length,
        data: { users }
      })
    }
  )

  getUserByIdHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params
      const user = await this._userServices.getUserById(id)
      res.status(200).json({
        status: 'success',
        data: {
          user
        }
      })
    }
  )

  updateUserHandler = catchAsync(
    async (
      req: Request<any, any, UpdateUserParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { id } = req.params
      const data = req.body

      if (req.file !== undefined) {
        const uploadApiResponse = await imageProcessing(
          req.file.buffer,
          'assets/images/avatars'
        )
        data.image = uploadApiResponse?.public_id
      }

      const user: IUser = await this._userServices.getUserByIdAndUpdate(
        data,
        id
      )

      res.status(200).json({
        status: 'success',
        data: {
          user
        }
      })
    }
  )

  deactivateUserHandler = catchAsync(
    async (
      req: Request<any, any, ActiveUserParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { id } = req.params
      const data: ActiveUserParams = {
        isActive: Boolean(req.body)
      }

      await this._userServices.getUserByIdAndUpdate(data, id)

      res.status(204).json({
        status: 'no content'
      })
    }
  )

  resetPasswordHandler = catchAsync(
    async (
      req: Request<any, any, ResetPasswordParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { currentPassword, password, confirmPassword } = req.body

      const { id } = req.user
      const user = await this._userServices.getUserById(id)

      const token = await extractHeaderInfo(req)
      const decode = await this._createToken.verifyAccessToken(token)
      const isPasswordValid = (await user.verifyPasswordChange(
        decode.iat as number
      )) as boolean

      if (user === null && !isPasswordValid)
        throw new UtilsError('invalid user request', 403)

      let comparePasswords: boolean = await user.decryptPassword(
        currentPassword,
        user.password
      )
      if (!comparePasswords) throw new UtilsError('invalid request', 400)

      comparePasswords = await user.decryptPassword(password, user.password)
      if (comparePasswords) throw new UtilsError('invalid request', 400)

      user.password = password
      user.confirmPassword = confirmPassword
      await user.save({ timestamps: true })

      res.status(200).json({
        status: 'OK',
        data: { user }
      })
    }
  )

  forgotPasswordResetHandler = catchAsync(
    async (
      req: Request<any, any, PasswordParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      /**
       * @todo
       * do a rediracte 🔥
       */
      const { resetToken } = req.params
      const { id } = await this._userServices.extractRedisToken(resetToken, 10)

      const user = await this._userServices.getUserById(id)
      const { password, confirmPassword } = req.body
      user.password = password
      user.confirmPassword = confirmPassword
      await user.save({ validateBeforeSave: true })

      await this._userServices.deleteRedisToken(resetToken)

      res.status(200).json({
        status: 'OK'
      })
    }
  )

  getAllInactiveAccountsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const users = await this._userServices.getInactiveUsers()

      res.status(200).json({
        status: 'OK',
        data: {
          records: users.length,
          users
        }
      })
    }
  )

  deleteUserAccountHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params
      await this._userServices.deleteUserById(id)

      res.status(204).json({
        status: 'no content'
      })
    }
  )

  forgotPasswordHandler = catchAsync(
    async (
      req: Request<any, any, ForgotPasswordParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { email } = req.body
      const user = await this._userServices.getUserByEmail(email)

      const resetToken = await generateToken()
      const timestamp = Math.floor(Date.now() / 1000) + 10 * 60

      await tokenDataStore(user.id, resetToken, timestamp)
      const restURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/reset-password/${resetToken}`
      const payload: EmailParams = {
        subject: 'reset your password',
        /**
         * @todo
         * create an HTML template then parse it here
         */
        message: `
        Dear ${user.username},

        We recently received a request to reset the password for your account. To complete this process, please click on the following link within the next 10 minutes:

        ${restURL}

        If you did not initiate this request or believe it is in error, please ignore this email, and your account will remain secure.

        For security reasons, this link will expire after 10 minutes.

        Thank you for choosing BINGWA!`,
        email: user.email
      }

      await mailTransporter(payload.email, payload.message, payload.subject)
      res.status(200).json({
        status: 'OK',
        data: {
          message: 'check your inbox, a link to reset your password was sent!'
        }
      })
    }
  )

  // TODO: session management for verified account
  // to prevent user from 'typing' their user credentials
  verifyAccountHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { token } = req.params
      const { id } = await this._userServices.extractRedisToken(token, 30)
      const data: ActiveUserParams = {
        isActive: true
      }
      const user = await this._userServices.getUserByIdAndUpdate(data, id)
      await this._userServices.deleteRedisToken(token)
      await mailTransporter(
        user.email,
        'account is verified',
        'verified account'
      )

      // TODO: generate an access token
      const payload: Payload = {
        email: user.email,
        id: user._id
      }

      const accessToken = this._createToken.createAccessToken(
        payload,
        process.env.JWT_EXPIRES_IN as string
      )
      res.status(200).json({
        status: 'OK',
        token: accessToken
      })
    }
  )

  userRelationshipHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params
      const queries = req.query
      const action: string = queries.action as string

      const resp = await this._userServices.userRelationship(
        req.user,
        id,
        action
      )
      res.status(201).json({
        status: 'created',
        data: { resp }
      })
    }
  )
}

export default UserController
