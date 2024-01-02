import bcrypt from 'bcryptjs'
import multer from 'multer'
import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../app'
import UtilsError from './app-error'
import { type Request } from 'express'

const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

const storage = multer.memoryStorage()
const uploadFiles = multer({ storage })

const imageProcessing = async (
  req: any,
  publicId: string
): Promise<UploadApiResponse | undefined> => {
  try {
    const res = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`,
      {
        use_filename: true,
        unique_filename: false,
        public_id: `${publicId}/${uuidv4()}`
      }
    )

    return res
  } catch (error) {
    logger.error(error)
    throw new UtilsError('internal server error', 500)
  }
}

const extractHeaderInfo = async (req: Request): Promise<string> => {
  const authorization = req.headers.authorization as string
  if (authorization === undefined) throw new UtilsError('authorization header invalid', 401)
  const fields: string[] = authorization.split(' ')
  if (fields.length !== 2) {
    throw new UtilsError('authorization header invalid', 401)
  }
  if (fields[0].toLowerCase() !== 'bearer') {
    throw new UtilsError('authorization type not implemented', 401)
  }

  const token: string = fields[1]
  return token
}

export { encryptPassword, imageProcessing, uploadFiles, extractHeaderInfo }
