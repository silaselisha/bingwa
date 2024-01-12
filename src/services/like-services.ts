import type mongoose from 'mongoose'
import { type likeParams } from '../controllers/like-controller'
import { type likeTypeEnum, type LikeModel, type ILike } from '../models/like-model'
import { type IPost } from '../models/post-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../util/app-error'
import { execTx } from '../store'

class LikeServices {
  constructor (private readonly _likeModel: LikeModel) { }

  getLikeById = async (userId: mongoose.Schema.Types.ObjectId, postId: mongoose.Schema.Types.ObjectId): Promise<ILike> => {
    const like: ILike = await this._likeModel.findOne({ user: userId, post: postId }).populate({ path: 'user', select: { username: true, image: true } }).populate({ path: 'post', select: { headline: true, thumbnail: true, createdAt: true } })

    return like
  }

  deleteLikeById = async (id: string): Promise<void> => {
    await this._likeModel.findByIdAndDelete(id)
  }

  getAllPostLikes = async (post: IPost, likeType: likeTypeEnum): Promise<ILike[]> => {
    /**
     * @todo
     * perform data aggregation for likes & dislikes
     */
    const likesIds = post.likes
    const likePromises: Array<Promise<ILike>> = []

    if (likesIds !== undefined) {
      likesIds?.forEach(async (like): Promise<void> => {
        likePromises.push(this._likeModel.findOne({ _id: like, likeType }))
      })
    }

    const likes = await Promise.all(likePromises)
    return likes
  }

  reactToAPost = async (user: IUser, post: IPost, likeType: likeTypeEnum): Promise<void> => {
    if (user._id.equals(post.author) === true) throw new UtilsError('you can\'t like/dislike your own post', 400)
    const data: likeParams = {
      user: user._id,
      post: post._id,
      likeType
    }

    const like = await this.getLikeById(user._id, post._id)
    if (like !== null && like.likeType !== data.likeType) {
      like.likeType = data.likeType
      await like.save({ validateBeforeSave: true })
      await post.save()
    }

    if (like !== null && like.likeType === data.likeType) {
      await this.deleteLikeById(like.id)
    }

    if (like === null) {
      await execTx(async (session): Promise<void> => {
        const resp = await this._likeModel.create(data)
        post.likes?.push(resp._id)

        await post.save()
        await session.commitTransaction()
      })
    }
  }
}

export default LikeServices
