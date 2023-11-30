import mongoose, { } from 'mongoose'
import validator from 'validator'
import { encryptPassword } from '../utils'

interface IUser extends mongoose.Document {
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
  createdAt: Date
  updatedAt: Date
}
/**
 *@todo
 *confirm password field & validate password to match ✅
 *install js validator to validate email, password, username, & names ✅
 *design ERD for users entity & posts entity
 */
const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: [true, 'username field is compulsory'],
    unique: true,
    trim: true,
    validate: [validator.isAlpha, 'invalid username']
  },
  email: {
    type: String,
    required: [true, 'email field is compulsory'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'invalid email address']
  },
  lastName: { type: String, required: true, validate: [validator.isAlpha, 'invalid name'] },
  firstName: { type: String, required: true, validate: [validator.isAlpha, 'invalid name'] },
  gender: {
    type: String,
    validate: {
      validator: function (v: string): boolean {
        return (v.toLowerCase().trim() === 'female' || 'male') as boolean
      },
      message: props => `${props.value} invalid gender`
    }
  },
  password: { type: String, required: true, minlength: 8, validate: [validator.isStrongPassword, 'weak password'] },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function (this: IUser): boolean {
        return this.confirmPassword === this.password
      }
    }
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: '{VALUE} is not supported'
    }
  },
  nationality: String,
  profession: String,
  dob: Date,
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) { next(); return }

  this.password = await encryptPassword(this.password)
  this.confirmPassword = ''
  next()
})

const userModel = mongoose.model<IUser>('User', userSchema)
export default userModel
