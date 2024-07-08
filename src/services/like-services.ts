import type mongoose from 'mongoose'
import { type LikeParams } from '../controllers/like-controller'
import {
  type LikeTypeEnum,
  type LikeModel,
  type ILike
} from '../models/like-model'
import { type IEvent } from '../models/event-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../util/app-error'
import { execTx } from '../store'

class LikeServices {
  constructor(private readonly _likeModel: LikeModel) {}

  getLikeById = async (
    userId: mongoose.Schema.Types.ObjectId,
    postId: mongoose.Schema.Types.ObjectId
  ): Promise<ILike> => {
    return this._likeModel
      .findOne({ user: userId, post: postId })
      .populate({ path: 'user', select: { username: true, image: true } })
      .populate({
        path: 'post',
        select: { headline: true, thumbnail: true, createdAt: true }
      })
  }

  deleteLikeById = async (id: string): Promise<void> => {
    await this._likeModel.findByIdAndDelete(id)
  }

  getAllEventLikes = async (
    event: IEvent,
    likeType: LikeTypeEnum
  ): Promise<ILike[]> => {
    /**
     * @todo
     * perform data aggregation for likes & dislikes
     */
    const likesIds = event.likes
    const likePromises: Array<Promise<ILike>> = []

    if (likesIds !== undefined) {
      likesIds?.forEach((like): void => {
        likePromises.push(this._likeModel.findOne({ _id: like, likeType }))
      })
    }

    return await Promise.all(likePromises)
  }

  reactToAnEvent = async (
    user: IUser,
    event: IEvent,
    likeType: LikeTypeEnum
  ): Promise<void> => {
    if (user._id.equals(event.author) === true)
      throw new UtilsError("you can't like/dislike your own post", 400)
    const data: LikeParams = {
      user: user._id,
      post: event._id,
      likeType
    }

    const like = await this.getLikeById(user._id, event._id)
    if (like !== null && like.likeType !== data.likeType) {
      like.likeType = data.likeType
      await like.save({ validateBeforeSave: true })
      await event.save()
    }

    if (like !== null && like.likeType === data.likeType) {
      await this.deleteLikeById(like.id)
    }

    if (like === null) {
      await execTx(async (session): Promise<void> => {
        const resp = await this._likeModel.create(data)
        event.likes?.push(resp._id)

        await event.save()
        await session.commitTransaction()
      })
    }
  }
}

export default LikeServices
