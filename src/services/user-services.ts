import { type deactivateUserParams, type updateUserParams } from '../controllers/user-controller'
import { type IUser, type UserModel } from '../models/user-model'
import UtilsError from '../utils/app-error'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

class UserServices {
  constructor (private readonly _userModel: UserModel) {}

  getUsers = async (): Promise<IUser[]> => {
    const users = await this._userModel.find({})
    return users
  }

  getUserById = async (id: string): Promise<IUser> => {
    const user: IUser = await this._userModel.findById(id).populate({ path: 'password', select: true }) as IUser
    if (user === undefined) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getUserByIdAndUpdate = async (data: updateUserParams | deactivateUserParams, id: string): Promise<IUser> => {
    const bool = 'isActive' in data
    const user = await this._userModel.findByIdAndUpdate(id, data, { new: true, timestamps: bool }) as IUser

    if (user === undefined) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getInactiveUsers = async (): Promise<IUser[]> => {
    const users: Array<Promise<IUser>> = await this._userModel.find({ isActive: false }).exec()
    dayjs.extend(relativeTime)

    const resp = await Promise.all(users)
    const inactiveUsers = resp.map((user): IUser | undefined => {
      if (dayjs(user.updatedAt).fromNow(true) === 'a month') {
        return user
      }
      return undefined
    })

    return inactiveUsers.filter((value) => value !== undefined) as unknown as IUser[]
  }

  deleteUserById = async (id: string): Promise<void> => {
    await this._userModel.findByIdAndDelete(id)
  }
}

export default UserServices
