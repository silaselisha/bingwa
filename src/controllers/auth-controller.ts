import { type NextFunction, type Request, type Response } from 'express'
import userModel from '../models/user-model'
import UtilsError, { catchAsync } from '../utils/app-error'
import { createAccessToken, type Payload } from '../utils/token'
import { decryptPassword } from '../utils'

export interface UserParams {
  username: string
  email: string
  lastName: string
  firstName: string
  gender?: string
  password: string
  confirmPassword: string
  profile?: string
  role: string
  nationality?: string
  profession?: string
  dob?: Date
  isActive?: boolean
}

export const authSignupHandler = catchAsync(
  async (
    req: Request<any, any, UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const data: UserParams = req.body
    const user = await userModel.create(data)

    const payload: Payload = { email: user.email }
    const token: string = await createAccessToken(payload)

    res.status(201).json({
      status: 'created',
      token,
      data: {
        user
      }
    })
  }
)

interface SigninParams {
  email: string
  password: string
}

/**
 * @TODO
 * check for an existing user && active user
 * validate the password
 * generate an access token
 */
export const authSigninHandler = catchAsync(
  async (
    req: Request<unknown, unknown, SigninParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const data: SigninParams = req.body

    const user = await userModel
      .findOne({ email: data.email })
      .populate({ path: 'password', select: true })
    if (user === null) throw new UtilsError('invalid email or password', 400)
    if (user.isActive === false) {
      throw new UtilsError('verify your account', 403)
    }

    const isValid: boolean = await decryptPassword(data.password, user.password)
    if (!isValid) throw new UtilsError('invalid email or password', 400)
    const payload: Payload = { email: user.email }
    const token: string = await createAccessToken(payload)

    res.status(200).json({
      status: 'Ok',
      token,
      message: 'signed in successfully'
    })
  }
)
