import { type resetPasswordParams, type deactivateUserParams, type updateUserParams } from '../controllers/user-controller'
import { type IUser, type UserModel } from '../models/user-model'
import UtilsError from '../utils/app-error'

class UserServices {
  constructor (private readonly _userModel: UserModel) {}

  getUsers = async (): Promise<IUser[]> => {
    const users = await this._userModel.find({})
    return users
  }

  getUserById = async (id: string): Promise<any> => {
    const user: IUser = await this._userModel.findById(id).populate({ path: 'password', select: true }) as IUser
    if (user === undefined) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getUserByIdAndUpdate = async (data: updateUserParams | deactivateUserParams | resetPasswordParams, id: string): Promise<IUser> => {
    const user = await this._userModel.findByIdAndUpdate(id, data, { new: true, timestamps: false }) as IUser

    if (user === undefined) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }
}

export default UserServices