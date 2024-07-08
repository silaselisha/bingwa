import type mongoose from 'mongoose'
import { catchAsync } from '../util/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import type EventServices from '../services/event-services'
import { type eventUpdateParams } from '../services/event-services'

export interface eventParams {
  headline: string
  article_body: string
  article_section: string
  citations?: string[]
  summary?: string
}

export interface eventInfoParams extends eventParams {
  author: mongoose.Schema.Types.ObjectId
  thumbnail?: string
  images?: string[]
}

/**
 * @todo
 * concurrently delete an event with it's comments ✅
 * update a post information ✅
 * bookmark an event 🔥
 * like/upvote disklike/downvote an event ✅
 * pagination & sorting event🔥
 * search functionality for event 🔥
 * post tags/category 🔥
 */
class EventController {
  constructor(private readonly _eventServices: EventServices) {}

  deleteEventHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { event_id: eventId } = req.params
      await this._eventServices.deleteEventAndComments(
        eventId,
        req.user.id,
        req.user.role,
        'admin'
      )

      res.status(204).json({
        status: 'no content'
      })
    }
  )

  createEventHandler = catchAsync(
    async (
      req: Request<any, any, eventParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const files = req.files as Record<string, Express.Multer.File[]>
      const eventUpdatesData: eventParams = req.body

      const event = await this._eventServices.createEvent(
        eventUpdatesData,
        files,
        req.user
      )

      res.status(201).json({
        status: 'created',
        data: {
          event
        }
      })
    }
  )

  getAllEventHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const queries = req.query
      const page = !Number.isNaN(queries.page) ? Number(queries.page) : 1
      const limit = !Number.isNaN(queries.limit) ? Number(queries.limit) : 3

      const events = await this._eventServices.getAllEvent(page, limit)

      res.status(200).json({
        status: 'OK',
        records: events.length,
        data: { events }
      })
    }
  )

  getEventHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { event_id: eventId } = req.params
      const event = await this._eventServices.getEventById(eventId)

      res.status(200).json({
        status: 'OK',
        data: { event }
      })
    }
  )

  updateEventHandler = catchAsync(
    async (
      req: Request<any, any, eventUpdateParams>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const files = req.files as Record<string, Express.Multer.File[]>
      const eventUpdatesData: eventUpdateParams = req.body
      const eventImageQueries = req.query
      const { event_id: eventId } = req.params

      const event = await this._eventServices.updateEventInfoById(
        eventUpdatesData,
        req.user,
        eventId,
        files,
        eventImageQueries
      )

      res.status(200).json({
        status: 'OK',
        data: { event }
      })
    }
  )
}

export default EventController
