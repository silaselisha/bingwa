import { type NextFunction, type Request, type Response } from 'express'
import userModel from '../models/user-model'
// import { logger } from '../app'
import { catchAsync } from '../utils/app-error'
import { createAccessToken, type Payload } from '../utils/token'

export interface UserParams {
  username: string
  email: string
  lastName: string
  firstName: string
  gender?: string
  password: string
  confirmPassword: string
  role: string
  nationality?: string
  profession?: string
  dob?: Date
  isActive?: boolean
}

export const authSignupHandler = catchAsync(async (req: Request<any, any, UserParams>, res: Response, next: NextFunction): Promise<void> => {
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
})
