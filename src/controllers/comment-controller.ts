import { type Request, type Response, type NextFunction } from 'express'
import commentModel, { type IComment } from '../models/comment-model'
import UtilsError, { catchAsync } from '../utils/app-error'
import type mongoose from 'mongoose'
import { logger } from '../app'
import postModel, { type IPost } from '../models/post-model'
import { execTx } from '../utils/db'

/**
 * @todo
 * creating a comment - get the post ID & user ID
 */
interface commentParams {
  comment: string
  post?: mongoose.Schema.Types.ObjectId
  author?: mongoose.Schema.Types.ObjectId
}

export const createComment = catchAsync(async (req: Request<any, any, commentParams>, res: Response, next: NextFunction): Promise<void> => {
  const postId = req.params.post_id
  const data: commentParams = {
    ...req.body,
    post: postId,
    author: req.user.id
  }

  let comment: IComment | undefined

  await execTx(async (session) => {
    const post = await postModel.findById({ _id: postId }).session(session) as IPost

    if (post === null) { throw new UtilsError('post not found', 400) }
    if (String(post.author) === req.user.id) { throw new UtilsError('forbiden to comment on your post', 403) }

    comment = await commentModel.create(data)
    if (comment === null) { throw new UtilsError(`comment for post ${post?.headline} not created`, 500) }

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

export const getAllComments = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const comments = await commentModel.find({})
    .populate({ path: 'post', select: { headline: true, iamge: true, createdAt: true } })
    .populate({ path: 'author', select: { username: true } })

  if (comments === undefined) throw new UtilsError('comments empty', 404)
  res.status(200).json({
    status: 'OK',
    data: {
      comments
    }
  })
})
