import { type Request, type Response, type NextFunction } from 'express'
import type LikeServices from '../services/like-services'
import { catchAsync } from '../util/app-error'
import { type IUser } from '../models/user-model'
import type EventServices from '../services/event-services'
import { type IEvent } from '../models/event-model'
import type mongoose from 'mongoose'
import { LikeTypeEnum } from '../models/like-model'

export interface LikeParams extends LikeTypeParams {
  user: mongoose.Schema.Types.ObjectId
  post: mongoose.Schema.Types.ObjectId
}
export interface LikeTypeParams {
  likeType: LikeTypeEnum
}

/**
 * @todo
 * delete a like/dislike
 * this happens when a client double clicks on like/dislike button
 */

class LikeController {
  constructor(
    private readonly _likeServices: LikeServices,
    private readonly _eventServices: EventServices
  ) {}

  getAllEventLikes = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { event_id: eventId } = req.params
      const event = (
        await this._eventServices.getEventById(eventId)
      ).depopulate()

      /**
       * @todo
       * perform datbase aggregation to know how many likes & dislikes * are in a single post
       */
      const likes = await this._likeServices.getAllEventLikes(
        event,
        LikeTypeEnum.like
      )
      res.status(200).json({
        status: 'OK',
        data: {
          records: likes.length,
          likes
        }
      })
    }
  )

  reactToAnEventHandler = catchAsync(
    async (
      req: Request<any, any, LikeTypeParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const user: IUser = req.user
      const action = req.query.action as LikeTypeEnum
      const { event_id: eventId } = req.params

      const event: IEvent = await this._eventServices.getEventById(eventId)

      await this._likeServices.reactToAnEvent(user, event, action)

      res.status(201).json({
        status: 'created'
      })
    }
  )
}

export default LikeController
