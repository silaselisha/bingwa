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
  reactToAPost = async (user: IUser, post: IPost, data: boolean): Promise<void> => {
    if (user._id.equals(post.author) === true) throw new UtilsError('you can\'t like/dislike your own post', 400)

    await execTx(async (session): Promise<void> => {

    })
  }
}

export default LikeServices
