import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { client } from '../server'
import UtilsError from '../util/app-error'
import {
  type IUser,
  type UserModel,
  type IUserMethods
} from '../models/user-model'
import {
  type UpdateUserParams,
  type ActiveUserParams,
  type TokenResetParams
} from '../types'
import { deleteImagesFromCloudinary } from '../util'
import Tooling from '../util/api-tools'

dayjs.extend(relativeTime)

class UserServices {
  constructor(private readonly _userModel: UserModel) {}

  getUsers = async (page: number, limit: number): Promise<IUser[]> => {
    const tooling = new Tooling(this._userModel.find({}))
    const apiTool = tooling.pagination(page, limit)

    const users = (await (await apiTool)._query) as IUser[]
    return users
  }

  getUserById = async (id: string): Promise<IUser & IUserMethods> => {
    const user = (await this._userModel
      .findById(id)
      .populate({ path: 'password', select: true })
      .exec()) as IUser & IUserMethods

    if (user === null) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getUserByEmail = async (email: string): Promise<IUser> => {
    const user = (await this._userModel.findOne({
      email,
      isActive: true
    })) as IUser
    if (user === null)
      throw new UtilsError(
        'user not found, signup or verify your account!',
        400
      )
    return user
  }

  getUserByIdAndUpdate = async (
    data: UpdateUserParams | ActiveUserParams,
    id: string
  ): Promise<IUser> => {
    const bool = 'isActive' in data && data.isActive
    const user = (await this._userModel.findByIdAndUpdate(id, data, {
      new: true,
      timestamps: bool
    })) as IUser

    if (user === null) {
      throw new UtilsError('could not update users data', 404)
    }
    return user
  }

  getInactiveUsers = async (): Promise<IUser[]> => {
    const users = (await this._userModel
      .find({ isActive: false })
      .exec()) as IUser[]

    const resp = await Promise.all(users)
    const inactiveUsers = resp.map((user): IUser | undefined => {
      if (dayjs(user.updatedAt).fromNow(true) === 'a month') {
        return user
      }
      return undefined
    })

    return inactiveUsers.filter(
      (value) => value !== undefined
    ) as unknown as IUser[]
  }

  deleteUserById = async (id: string): Promise<void> => {
    const user: IUser = await this.getUserById(id)

    if (user?.image !== 'avatar.jpg') {
      await deleteImagesFromCloudinary(user?.image as string, 'image')
    }
    await this._userModel.deleteOne({ _id: id })
  }

  extractRedisToken = async (
    token: string,
    period: number
  ): Promise<TokenResetParams> => {
    const data = (await client.hGetAll(token)) as unknown as TokenResetParams
    if (data.token !== token)
      throw new UtilsError('invalid link! kindly request for a new link.', 400)

    const tokenDate = new Date(parseInt(data.timestamp) * 1000)

    const duration = parseInt(dayjs(tokenDate).fromNow(true).split(' ')[0])
    if (duration >= period)
      throw new UtilsError('invalid link! kindly request for a new link.', 400)

    return data
  }

  deleteRedisToken = async (token: string): Promise<void> => {
    await client.del(token)
  }

  userRelationship = async (
    follower: IUser,
    followeeId: string,
    action: string
  ): Promise<string> => {
    if (follower._id.equals(followeeId) === true)
      throw new UtilsError("can't follow your own account", 403)

    const followee = await this.getUserById(followeeId)
    if (action !== 'follow' && action !== 'unfollow')
      throw new UtilsError('not allowed to perform this request', 403)

    if (followee.followers.includes(follower._id) && action === 'follow')
      throw new UtilsError("can't double follow this account", 400)

    if (action === 'follow') {
      followee.followers.push(follower._id)
      await followee.save({ validateModifiedOnly: true })
      return 'followed'
    }

    const followers = followee.followers.filter(
      (id) => follower._id.equals(id) === false
    )

    if (action === 'unfollow') {
      followee.followers = followers
      await followee.save({ validateModifiedOnly: true })
    }
    return 'unfollowed'
  }
}

export default UserServices
