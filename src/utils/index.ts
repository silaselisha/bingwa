// import path from 'path'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../app'
import UtilsError from './app-error'

const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

const decryptPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const storage = multer.memoryStorage()
const uploadFiles = multer({ storage })

const imageProcessing = async (req: any): Promise<UploadApiResponse | undefined> => {
  try {
    const res = await cloudinary.uploader.upload(`data:image/jpeg;base64,${req.file.buffer.toString('base64')}`, { use_filename: true, unique_filename: false, public_id: `assets/images/posts/thumbnails/${uuidv4()}` })

    return res
  } catch (error) {
    logger.error(error)
    throw new UtilsError('internal server error', 500)
  }
}

export { decryptPassword, encryptPassword, imageProcessing, uploadFiles }
