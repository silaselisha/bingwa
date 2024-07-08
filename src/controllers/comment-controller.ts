import { type Request, type Response, type NextFunction } from 'express'
import { type IComment } from '../models/comment-model'
import UtilsError, { catchAsync } from '../util/app-error'
import type mongoose from 'mongoose'
import eventModel, { type IEvent } from '../models/event-model'
import { execTx } from '../store'
import type CommentServices from '../services/comment-services'
import { winstonLogger } from '../util'

export interface commentParams {
  comment: string
  post?: mongoose.Schema.Types.ObjectId
  author?: mongoose.Schema.Types.ObjectId
}

class CommentController {
  constructor(private readonly _commentServices: CommentServices) {}
  createCommentHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const eventId = req.params.event_id
      const data: commentParams = {
        ...req.body,
        event: eventId,
        author: req.user.id
      }

      let comment: IComment | undefined

      await execTx(async (session) => {
        const event = (await eventModel
          .findById({ _id: eventId })
          .session(session)) as IEvent

        if (event === null) {
          throw new UtilsError('post not found', 400)
        }
        if (String(event.author) === req.user.id) {
          throw new UtilsError('forbiden to comment on your post', 403)
        }

        comment = await this._commentServices.create(data)
        if (comment === null) {
          throw new UtilsError(
            `comment for post ${event?.headline} not created`,
            500
          )
        }

        event?.comments?.push(comment._id)
        await event.save()
        await session.commitTransaction()
        winstonLogger('info', 'combined.log').info(
          'transaction commited successfully...'
        )
      })

      res.status(201).json({
        status: 'created',
        data: {
          comment
        }
      })
    }
  )

  getAllCommentsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { post_id: postId } = req.params
      const queries = req.query
      const page = !Number.isNaN(queries.page) ? Number(queries.page) : 1
      const limit = !Number.isNaN(queries.limit) ? Number(queries.limit) : 3

      const comments = await this._commentServices.getAllComments(
        page,
        limit,
        postId
      )

      if (comments === undefined) throw new UtilsError('comments empty', 404)
      res.status(200).json({
        status: 'OK',
        data: {
          comments
        }
      })
    }
  )

  deleteCommentByIdHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      await execTx(async (session) => {
        const params = req.params
        const event = await eventModel
          .findById({ _id: params.post_id })
          .session(session)
        if (event === undefined) {
          throw new UtilsError('invalid request, post not found', 400)
        }
        if (event.comments.includes(params.commentId) === false) {
          throw new UtilsError('no such comment on this post', 400)
        }

        event.comments = event.comments.filter(
          (id: mongoose.Schema.Types.ObjectId): any =>
            String(id) !== params.commentId
        )

        await this._commentServices.deleteById(params.commentId)
        await event.save()
        await session.commitTransaction()
      })

      res.status(204).json({
        status: 'no content'
      })
    }
  )
}

export default CommentController
