import mongoose from 'mongoose'

import {
  type IUser,
  type UserModel,
  type IUserMethods
} from '../models/user-model'
import { type UserParams, type SigningParams } from '../types'
import UtilsError from '../util/app-error'

class AuthServices {
  constructor(private readonly _userModel: UserModel) {}

  signup = async (data: UserParams): Promise<IUser> => {
    return await this._userModel.create(data)
  }

  signing = async (data: SigningParams): Promise<IUser & IUserMethods> => {
    const user = (await this._userModel
      .findOne({ email: data.email })
      .populate({ path: 'password', select: true })
      .exec()) as IUser & IUserMethods

    if (user === null) throw new UtilsError('invalid email or password', 400)

    if (user.isActive === false) {
      throw new UtilsError('verify your account', 403)
    }

    return user
  }
}

export default AuthServices
