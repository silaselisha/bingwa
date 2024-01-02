import { type Request, type Response, type NextFunction } from 'express'
import { logger } from '../app'
import { extractHeaderInfo, imageProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'
import type UserServices from '../services/user-services'
import UtilsError, { catchAsync } from '../utils/app-error'
import { type IUser } from '../models/user-model'
import type AccessToken from '../utils/token'

export interface updateUserParams {
  dob?: Date
  image?: string
  gender?: string
  username?: string
  profession?: string
  nationality?: string
}

export interface deactivateUserParams {
  isActive: string
  updatedAt?: any /** @todo change type any to Date */
}
export interface resetPasswordParams {
  currentPassword: string
  password: string
  confirmPassword: string
}

/**
 * @todo
 * user reset password functionality 🔥
 * user activating account functionality (2FA & email activation) 🔥
 * push notification
 * user can have followers & user can follow other users
 */
class UserController {
  constructor (private readonly _userServices: UserServices, private readonly _createToken: AccessToken) { }

  getAllUsersHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users = await this._userServices.getUsers()
    res.status(200).json({
      status: 'OK',
      records: users.length,
      data: { users }
    })
  })

  getUserByIdHnadler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const user = await this._userServices.getUserById(id)
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  })

  updateUserHandler = catchAsync(async (req: Request<any, any, updateUserParams>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const data = req.body

    if (req.file !== undefined) {
      const uploadApiResponse = (await imageProcessing(
        req,
        'assets/images/avatars'
      )) as UploadApiResponse
      data.image = uploadApiResponse?.public_id
    }

    const user: IUser = await this._userServices.getUserByIdAndUpdate(data, id)
    logger.info(user)
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  })

  /**
   * @example
   * temporarily deactivate user account
   * isActive: false
   * updatedAt: 01/01/2024
   * account is deleted after 30 inactive days
   * cron jobs will run once in a day #midnight
   */
  deactivateUserHandler = catchAsync(async (req: Request<any, any, deactivateUserParams>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const data: deactivateUserParams = {
      ...req.body,
      updatedAt: Date.now()
    }

    await this._userServices.getUserByIdAndUpdate(data, id)
    res.status(204).json({
      status: 'no content'
    })
  })

  resetPasswordHandler = catchAsync(async (req: Request<any, any, resetPasswordParams>, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, password, confirmPassword } = req.body

    const { id } = req.user
    const user = await this._userServices.getUserById(id) as IUser

    const token: string = await extractHeaderInfo(req)
    const decode = await this._createToken.verifyAccessToken(token)
    const isPasswordValid = await user.verifyPasswordChange(decode.iat as number)
    console.log(isPasswordValid)

    if (user === null && !isPasswordValid) throw new UtilsError('invalid user request', 403)

    if (!await user.decryptPassword(currentPassword, user.password)) throw new UtilsError('invalid request', 400)
    if (await user.decryptPassword(password, user.password)) throw new UtilsError('invalid request', 400)

    user.password = password
    user.confirmPassword = confirmPassword
    await user.save({ timestamps: true })

    res.status(200).json({
      status: 'OK',
      data: { user }
    })
  })
}

export default UserController
