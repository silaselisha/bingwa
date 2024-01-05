import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { client } from '../server'
import UtilsError from '../utils/app-error'
import { type IUser, type UserModel } from '../models/user-model'
import { type updateUserParams, type activeUserParams, type tokenResetParams } from '../types'

dayjs.extend(relativeTime)

class UserServices {
  constructor (private readonly _userModel: UserModel) {}

  getUsers = async (): Promise<IUser[]> => {
    const users = await this._userModel.find({})
    return users
  }

  getUserById = async (id: string): Promise<IUser> => {
    const user: IUser = await this._userModel.findById(id).populate({ path: 'password', select: true }) as IUser
    console.log(user)
    if (user === null) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getUserByEmail = async (email: string): Promise<IUser> => {
    const user = await this._userModel.findOne({ email, isActive: true }) as IUser
    if (user === null) throw new UtilsError('user not found, signup or verify your account!', 400)
    return user
  }

  getUserByIdAndUpdate = async (data: updateUserParams | activeUserParams, id: string): Promise<IUser> => {
    const bool = 'isActive' in data && data.isActive
    const user = await this._userModel.findByIdAndUpdate(id, data, { new: true, timestamps: bool }) as IUser

    if (user === null) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getInactiveUsers = async (): Promise<IUser[]> => {
    const users: Array<Promise<IUser>> = await this._userModel.find({ isActive: false }).exec()

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

  extractRestTokenDataFromRedis = async (token: string, period: number): Promise<tokenResetParams> => {
    const data = await client.hGetAll(token) as unknown as tokenResetParams
    if (data.token !== token) throw new UtilsError('invalid link! kindly request for a new link.', 400)

    const tokenDate = new Date(parseInt(data.timestamp) * 1000)

    const duration = parseInt(dayjs(tokenDate).fromNow(true).split(' ')[0])
    if (duration >= period) throw new UtilsError('invalid link! kindly request for a new link.', 400)

    return data
  }

  deleteResetTokenFromRedis = async (token: string): Promise<void> => {
    await client.del(token)
  }
}

export default UserServices
