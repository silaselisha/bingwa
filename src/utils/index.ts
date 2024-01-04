import crypto from 'crypto'
import bcrypt from 'bcryptjs'

import multer from 'multer'
import { CronJob } from 'cron'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary'

import { logger } from '../app'
import UtilsError from './app-error'
import { type Request } from 'express'
import type UserServices from '../services/user-services'

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

const generateResetToken = async (): Promise<string> => {
  const unHashedToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(unHashedToken).digest('hex')

  return hashedToken
}

const mailTransporter = async (email: string, message: string, subject: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.BINGWA_MAIL_GUN_HOSTNAME,
    port: parseInt(process.env.BINGWA_MAIL_GUN_PORT as string, 10),
    secure: false,
    auth: { user: process.env.BINGWA_MAIL_GUN_USER, pass: process.env.BINGWA_MAIL_GUN_PASS }
  })

  await transporter.sendMail({ from: 'elisilas@outlook.com', to: email, subject, text: message })
}

class CronJobs {
  constructor (private readonly _userServices: UserServices) { }

  deleteUserAccountsJob = CronJob.from({
    cronTime: '5 0 * * *',
    onTick: async (): Promise<void> => {
      logger.warn('deleting inactive user accounts...')
      const users = await this._userServices.getInactiveUsers()
      users.map(async (user): Promise<void> => {
        try {
          await cloudinary.uploader.destroy(user?.image as string, { resource_type: 'image' })
        } catch (err) {
          throw new UtilsError('internal server error', 500)
        }
        await this._userServices.deleteUserById(user._id)
      })
    },
    start: true
  })
}

export { encryptPassword, imageProcessing, uploadFiles, extractHeaderInfo, generateResetToken, mailTransporter }
export default CronJobs
