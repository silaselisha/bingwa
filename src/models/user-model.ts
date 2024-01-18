import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import { encryptPassword } from '../util'

export interface IUser extends mongoose.Document {
  username: string
  email: string
  lastName: string
  firstName: string
  gender?: string
  password: string
  confirmPassword: string
  image?: string
  role?: string
  nationality?: string
  profession?: string
  dob?: Date
  phone: string
  nationalID: number
  isPhoneVerified?: boolean
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
  followers: mongoose.Schema.Types.ObjectId[]
  decryptPassword: (password: string, password1: string) => Promise<boolean>
  verifyPasswordChange: (arg: number) => Promise<boolean>
}

interface IUserMethods {
  verifyPasswordChange: (arg: number) => Promise<boolean>
  decryptPassword: (password: string, hashedPassword: string) => Promise<boolean>
}

export type UserModel = mongoose.Model<IUser, any, IUserMethods>
/**
 *@todo
 *design ERD for users entity & posts entity
 */
const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: [true, 'username field is compulsory'],
      unique: true,
      trim: true,
      validate: [validator.isAlphanumeric, 'invalid username']
    },
    email: {
      type: String,
      required: [true, 'email field is compulsory'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'invalid email address']
    },
    lastName: {
      type: String,
      required: true,
      validate: [validator.isAlpha, 'invalid name']
    },
    firstName: {
      type: String,
      required: true,
      validate: [validator.isAlpha, 'invalid name']
    },
    gender: {
      type: String,
      validate: {
        validator: function (v: string): boolean {
          return (v.toLowerCase().trim() === 'female' || 'male') as boolean
        },
        message: (props) => `${props.value} invalid gender`
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
      validate: [validator.isStrongPassword, 'weak password']
    },
    confirmPassword: {
      type: String,
      required: true,
      validate: {
        validator: function (this: IUser): boolean {
          return this.confirmPassword === this.password
        },
        message: 'password don\'t match'
      }
    },
    image: {
      type: String,
      default: 'avatar.jpg'
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: '{VALUE} is not supported'
      },
      default: 'user'
    },
    nationalID: {
      type: Number,
      validate: {
        validator: function (this: IUser): boolean {
          return /^[0-9]{8}$/.test(String(this.nationalID))
        },
        message: 'invalid national ID'
      }
    },
    phone: {
      type: String,
      required: true,
      validate: [validator.isMobilePhone, 'provide a valid phone number']
    },
    nationality: String,
    profession: String,
    dob: Date,
    isActive: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
)

/**
 * @todo
 * get password change time in ms
 * get issued at from jwt in ms
 * compare the two timestamps
 * @returns
 */
userSchema.methods.verifyPasswordChange = async function (
  jwtIssuedAt: number
): Promise<boolean> {
  const updatedAtMs: number = parseInt(
    (this.updatedAt.getTime() / 1000).toFixed(),
    10
  )
  return updatedAtMs > jwtIssuedAt
}

userSchema.methods.decryptPassword = async (password: string,
  hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
    return
  }

  this.password = await encryptPassword(this.password)
  this.set('confirmPassword', undefined)
  next()
})

const userModel = mongoose.model<IUser, UserModel>('User', userSchema)
export default userModel
