import {
  type userParams,
  type signinParams
} from '../controllers/auth-controller'
import { type IUser, type UserModel } from '../models/user-model'

class AuthServices {
  constructor (private readonly _userModel: UserModel) {}

  signup = async (data: userParams): Promise<IUser> => {
    const user = await this._userModel.create(data)
    return user
  }

  signin = async (data: signinParams): Promise<IUser> => {
    const user = await this._userModel
      .findOne({ email: data.email })
      .populate({ path: 'password', select: true }) as IUser

    return user
  }
}

export default AuthServices
