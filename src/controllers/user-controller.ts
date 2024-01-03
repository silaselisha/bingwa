import { type Request, type Response, type NextFunction } from 'express'
import { extractHeaderInfo, imageProcessing } from '../utils'
import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary'
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
  isActive: boolean
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

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  })

  deactivateUserHandler = catchAsync(async (req: Request<any, any, deactivateUserParams>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const data: deactivateUserParams = {
      isActive: Boolean(req.body)
    }

    await this._userServices.getUserByIdAndUpdate(data, id)

    res.status(204).json({
      status: 'no content'
    })
  })

  resetPasswordHandler = catchAsync(async (req: Request<any, any, resetPasswordParams>, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, password, confirmPassword } = req.body

    const { id } = req.user
    const user = await this._userServices.getUserById(id)

    const token = await extractHeaderInfo(req)
    const decode = await this._createToken.verifyAccessToken(token)
    const isPasswordValid = await user.verifyPasswordChange(decode.iat as number) as boolean

    if (user === null && !isPasswordValid) throw new UtilsError('invalid user request', 403)

    let comparePasswords: boolean = await user.decryptPassword(currentPassword, user.password)
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
  })

  getAllInactiveAccountsHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users = await this._userServices.getInactiveUsers()

    res.status(200).json({
      status: 'OK',
      data: {
        records: users.length,
        users
      }
    })
  })

  deleteUserAccountHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user
    const { id } = req.params

    await this._userServices.deleteUserById(id)
    await cloudinary.uploader.destroy(user?.image as string, { resource_type: 'image' })

    res.status(204).json({
      status: 'no content'
    })
  })
}

export default UserController
