import { type Request, type Response, type NextFunction } from 'express'
import userModel from '../models/user-model'
import { catchAsync } from '../utils/app-error'

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users = await userModel.find({})
    res.status(200).json({
      status: 'OK',
      records: users.length,
      data: {
        users
      }
    })
  }
)
