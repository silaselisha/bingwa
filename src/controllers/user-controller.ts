import { type Request, type Response, type NextFunction } from 'express'
import userModel, { } from '../models/user-model'
import UtilsError, { catchAsync } from '../utils/app-error'
import { logger } from '../app'
import { imageProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'

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

interface UpdateUserParams {
  dob?: Date
  image?: string
  gender?: string
  username?: string
  profession?: string
  nationality?: string
}

/**
 * @summary
 * user should update his/her data
 * only admin can update other users' data
 */
export const updateUser = catchAsync(
  async (
    req: Request<any, any, UpdateUserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params
    const data = req.body

    if (req.file !== undefined) {
      const uploadApiResponse = (await imageProcessing(
        req,
        'assets/images/avatars'
      )) as UploadApiResponse
      data.image = uploadApiResponse?.public_id
    }

    const user = await userModel.findByIdAndUpdate(id, data, { new: true })
    if (user === undefined) {
      throw new UtilsError('could not update users data', 404)
    }
    logger.info(user)

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  }
)

export const getUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const user = await userModel.findById(id)
    if (user === undefined) throw new UtilsError('user not found', 404)

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  }
)

/**
 * @todo
 * deactivate account and deleted in 30 days when user does not login back
 */
export const deactivateUserAccount = catchAsync(async (req, res, next): Promise<void> => {
  const { id } = req.params
  const user = await userModel.findByIdAndUpdate(id, { isActive: false, updatedAt: Date.now() })
  logger.info(user)

  res.status(204).json({
    status: 'no content'
  })
})
