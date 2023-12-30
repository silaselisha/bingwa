import { type commentParams } from '../controllers/comment-controller'
import { type IComment, type CommentModel } from '../models/comment-model'

class CommentServices {
  constructor (private readonly _commentModel: CommentModel) {}

  create = async (data: commentParams): Promise<IComment> => {
    const comment: IComment = await this._commentModel.create(data)
    return comment
  }

  getAllComments = async (): Promise<IComment[]> => {
    const comments: IComment[] = await this._commentModel.find({}).populate({
      path: 'post',
      select: { headline: true, image: true, createdAt: true }
    }).populate({ path: 'author', select: { username: true } })

    return comments
  }

  deleteById = async (id: string): Promise<void> => {
    await this._commentModel.findByIdAndDelete({ _id: id })
  }
}

export default CommentServices
