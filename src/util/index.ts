import crypto from 'crypto'
import bcrypt from 'bcryptjs'

import multer from 'multer'
import { CronJob } from 'cron'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary'

import UtilsError from './app-error'
import { type Request } from 'express'
import type UserServices from '../services/user-services'
import winston from 'winston'

const winstonLogger = (level: string, filename: string): winston.Logger => {
  return process.env.NODE_ENV === 'development'
    ? winston.createLogger({
        level,
        transports: [
          new winston.transports.Console({
            format: winston.format.simple()
          }),
          new winston.transports.File({ filename })
        ]
      })
    : winston.createLogger({
        level,
        transports: [new winston.transports.File({ filename })]
      })
}

const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

const storage = multer.memoryStorage()
const uploadFiles = multer({ storage })

/**
 * @todo
 * ensure that imageProcessing is dynamic
 * should be able to process either req.file or req.files
 */
const imagesProcessing = (
  files: Record<string, Express.Multer.File[]>,
  assetFolder: string,
  resource: string,
  imagePromises: Array<Promise<UploadApiResponse>>
): void => {
  if (files[resource] !== undefined) {
    files[resource].forEach((image): void => {
      imagePromises.push(imageProcessing(image.buffer, assetFolder))
    })
  }
}

const imageProcessing = async (
  buffer: Buffer,
  publicId: string
): Promise<UploadApiResponse> => {
  try {
    return await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        use_filename: true,
        unique_filename: false,
        public_id: `${publicId}/${uuidv4()}`
      }
    )
  } catch (err) {
    winstonLogger('error', 'error.log').error(err)
    throw new UtilsError(`internal server error: ${err}`, 500)
  }
}

const extractHeaderInfo = async (req: Request): Promise<string> => {
  const authorization = req.headers.authorization as string
  if (authorization === undefined)
    throw new UtilsError('authorization header invalid', 401)
  const fields: string[] = authorization.split(' ')
  if (fields.length !== 2) {
    throw new UtilsError('authorization header invalid', 401)
  }
  if (fields[0].toLowerCase() !== 'bearer') {
    throw new UtilsError('authorization type not implemented', 401)
  }

  return fields[1]
}

const generateToken = async (): Promise<string> => {
  const unHashedToken = crypto.randomBytes(32).toString('hex')
  return crypto.createHash('sha256').update(unHashedToken).digest('hex')
}

const mailTransporter = async (
  email: string,
  message: string,
  subject: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.BINGWA_MAIL_GUN_HOSTNAME,
    port: parseInt(process.env.BINGWA_MAIL_GUN_PORT as string, 10),
    secure: false,
    auth: {
      user: process.env.BINGWA_MAIL_GUN_USER,
      pass: process.env.BINGWA_MAIL_GUN_PASS
    }
  })

  await transporter.sendMail({
    from: 'elisilas@outlook.com',
    to: email,
    subject,
    text: message
  })
}

export const deleteImagesFromCloudinary = async (
  image: string,
  resourceType: string
): Promise<void> => {
  await cloudinary.uploader.destroy(image, { resource_type: resourceType })
}

class JobScheduler {
  constructor(private readonly _userServices: UserServices) {}

  deleteUserAccountsJob = CronJob.from({
    cronTime: '5 0 * * *',
    onTick: async (): Promise<void> => {
      winstonLogger('warn', 'combined.log').warn(
        'deleting inactive user accounts...'
      )
      const users = await this._userServices.getInactiveUsers()
      users.map(async (user): Promise<void> => {
        try {
          await cloudinary.uploader.destroy(user?.image as string, {
            resource_type: 'image'
          })
        } catch (err) {
          winstonLogger('error', 'error.log').error(err)
          throw new UtilsError('internal server error', 500)
        }
        await this._userServices.deleteUserById(user._id)
      })
    },
    start: true
  })
}

export {
  encryptPassword,
  imageProcessing,
  uploadFiles,
  extractHeaderInfo,
  generateToken,
  mailTransporter,
  imagesProcessing,
  winstonLogger
}
export default JobScheduler
