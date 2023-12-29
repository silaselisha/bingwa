import { type postParams } from '../controllers/post-controller'
import { type IPost, type PostModel } from '../models/post-model'
import UtilsError from '../utils/app-error'

class PostServices {
  constructor (private readonly _postModel: PostModel) {}

  create = async (data: postParams): Promise<IPost> => {
    const post: IPost = await this._postModel.create(data)
    if (post === null) throw new UtilsError('internal server error', 500)
    return post
  }
}

export default PostServices
