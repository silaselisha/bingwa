import { type likeParams, type likeTypeParams } from '../controllers/like-controller'
import { type LikeModel } from '../models/like-model'
import { type IPost } from '../models/post-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../utils/app-error'
import { execTx } from '../utils/db'

class LikeServices {
  constructor (private readonly _likeModel: LikeModel) { }
  /**
   * @param user
   * users/not either post owner o admin to like/dislkie a post ✅
   * concurrently update the post & persist the like
   */
  reactToAPost = async (user: IUser, post: IPost, likeType: likeTypeParams): Promise<void> => {
    if (user._id.equals(post.author) === true) throw new UtilsError('you can\'t like/dislike your own post', 400)

    const data: likeParams = {
      ...likeType,
      author: user._id,
      post: post._id
    }

    await execTx(async (session): Promise<void> => {
      const like = await this._likeModel.create(data)
      post.likes?.push(like._id)
      await post.save({ validateBeforeSave: false })
      await session.commitTransaction()
    })
  }
}

export default LikeServices
