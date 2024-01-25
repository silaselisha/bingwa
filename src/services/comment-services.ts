import { type commentParams } from '../controllers/comment-controller'
import { type IComment, type CommentModel } from '../models/comment-model'
import Tooling from '../util/api-tools'

class CommentServices {
  constructor (private readonly _commentModel: CommentModel) {}

  create = async (data: commentParams): Promise<IComment> => {
    return await this._commentModel.create(data)
  }

  getAllComments = async (page: number, limit: number, postId: string): Promise<IComment[]> => {
    const tooling = new Tooling(this._commentModel.find({ post: postId }))
    const apiTool = (await (await tooling.pagination(page, limit)).populate('post', { headline: true, image: true, createdAt: true })).populate('author', { username: true, image: true })

    return await (await apiTool)._query as IComment[]
  }

  deleteById = async (id: string): Promise<void> => {
    await this._commentModel.findByIdAndDelete({ _id: id })
  }
}

export default CommentServices
