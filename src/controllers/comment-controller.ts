import { type Request, type Response, type NextFunction } from 'express'
import { type IComment } from '../models/comment-model'
import UtilsError, { catchAsync } from '../utils/app-error'
import type mongoose from 'mongoose'
import { logger } from '../app'
import postModel, { type IPost } from '../models/post-model'
import { execTx } from '../utils/db'
import type CommentServices from '../services/comment-services'

/**
 * @summary
 * creating a comment - get the post ID & user ID
 */
export interface commentParams {
  comment: string
  post?: mongoose.Schema.Types.ObjectId
  author?: mongoose.Schema.Types.ObjectId
}

class CommentController {
  constructor (private readonly _commentServices: CommentServices) {}
  createCommentHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const postId = req.params.post_id
    const data: commentParams = {
      ...req.body,
      post: postId,
      author: req.user.id
    }

    let comment: IComment | undefined

    await execTx(async (session) => {
      const post = (await postModel
        .findById({ _id: postId })
        .session(session)) as IPost

      if (post === null) {
        throw new UtilsError('post not found', 400)
      }
      if (String(post.author) === req.user.id) {
        throw new UtilsError('forbiden to comment on your post', 403)
      }

      comment = await this._commentServices.create(data)
      if (comment === null) {
        throw new UtilsError(
          `comment for post ${post?.headline} not created`,
          500
        )
      }

      post?.comments?.push(comment._id)
      await post.save()
      await session.commitTransaction()
      logger.info('transaction commited successfully...')
    })

    res.status(201).json({
      status: 'created',
      data: {
        comment
      }
    })
  })

  getAllCommentsHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const comments = await this._commentServices.getAllComments()

    if (comments === undefined) throw new UtilsError('comments empty', 404)
    res.status(200).json({
      status: 'OK',
      data: {
        comments
      }
    })
  })

  deleteCommentByIdHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await execTx(async (session) => {
      const params = req.params
      const post = await postModel
        .findById({ _id: params.post_id })
        .session(session)
      if (post === undefined) { throw new UtilsError('invalid request, post not found', 400) }
      if (post.comments.includes(params.commentId) === false) { throw new UtilsError('no such comment on this post', 400) }

      const updatedComments = post.comments.filter(
        (id: mongoose.Schema.Types.ObjectId): any =>
          String(id) !== params.commentId
      )
      post.comments = updatedComments

      await this._commentServices.deleteById(params.commentId)
      await post.save()
      await session.commitTransaction()
      logger.warn('OK transaction ')
    })

    res.status(204).json({
      status: 'no content'
    })
  })
}

export default CommentController
