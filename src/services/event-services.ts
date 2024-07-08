import type mongoose from 'mongoose'
import {
  type eventParams,
  type eventInfoParams
} from '../controllers/event-controller'
import { type IEvent, type EventModel } from '../models/event-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../util/app-error'
import { execTx } from '../store'
import type CommentServices from './comment-services'
import { type IComment } from '../models/comment-model'
import { deleteImagesFromCloudinary, imagesProcessing } from '../util'
import { type UploadApiResponse } from 'cloudinary'
import Tooling from '../util/api-tools'

export interface eventUpdateParams {
  headline?: string
  article_body?: string
  article_section?: string
  thumbnail?: string
  images?: string[]
  summary?: string
  citations?: string[]
}

class EventServices {
  constructor(
    private readonly _eventModel: EventModel,
    private readonly _commentServices: CommentServices
  ) {}

  createEvent = async (
    eventUpdatesData: eventParams,
    files: Record<string, Express.Multer.File[]>,
    user: IUser
  ): Promise<IEvent> => {
    let eventThumbnail: UploadApiResponse | undefined
    const eventImages: string[] = []
    const imagePromises: Array<Promise<UploadApiResponse>> = []

    imagesProcessing(
      files,
      'assets/images/posts/thumbnails',
      'thumbnail',
      imagePromises
    )
    imagesProcessing(
      files,
      'assets/images/posts/images',
      'images',
      imagePromises
    )

    const images = await Promise.all(imagePromises)
    if (files?.thumbnail !== undefined) {
      eventThumbnail = images.shift()
    }

    if (files.images !== undefined) {
      images.forEach((image) => {
        eventImages.push(image.public_id)
      })
    }

    const data: eventInfoParams = {
      ...eventUpdatesData,
      author: user._id,
      images: eventImages,
      thumbnail: eventThumbnail?.public_id
    }

    const event: IEvent = await this._eventModel.create(data)
    if (event === null) throw new UtilsError('internal server error', 500)
    return event
  }

  getEventById = async (
    eventId: string,
    session?: mongoose.mongo.ClientSession
  ): Promise<IEvent> => {
    const event = (await this._eventModel
      .findById(eventId)
      .populate({ path: 'author', select: { username: true, image: true } })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: { username: true, image: true, role: true }
        }
      })
      .populate({
        path: 'likes',
        populate: { path: 'user', select: { username: true, image: true } }
      })
      .session(session)) as IEvent

    if (event === null) throw new UtilsError('post not found', 404)
    return event
  }

  getAllEvent = async (offset: number, limit: number): Promise<IEvent[]> => {
    const tooling = new Tooling(this._eventModel.find({}))
    const apiPagination = await (
      await (
        await tooling.pagination(offset, limit)
      ).populate('author', { username: true, image: true }, '')
    ).populate('comments', '', {
      path: 'author',
      select: { username: true, image: true }
    })

    return (await apiPagination._query) as IEvent[]
  }

  deleteEvent = async (eventId: string): Promise<void> => {
    await this._eventModel.findByIdAndDelete(eventId)
  }

  updateEventInfoById = async (
    eventUpdateData: eventUpdateParams,
    user: IUser,
    eventId: string,
    files: Record<string, Express.Multer.File[]>,
    eventImageQueries: any
  ): Promise<IEvent> => {
    const event: IEvent = (await this.getEventById(eventId)).depopulate()
    if (user._id.equals(event.author) !== true)
      throw new UtilsError('not allowed to perform this request', 403)

    let eventThumbnail: UploadApiResponse | undefined
    let eventImages: string[] = event.images as string[]

    if (files?.thumbnail !== undefined) {
      const imagePromises: Array<Promise<UploadApiResponse>> = []
      imagesProcessing(
        files,
        'assets/images/posts/thumbnails',
        'thumbnail',
        imagePromises
      )
      const images = await Promise.all(imagePromises)
      eventThumbnail = images.shift()

      event.thumbnail !== undefined &&
        (await deleteImagesFromCloudinary(event.thumbnail, 'image'))
    }

    if (files.images !== undefined) {
      const imagePromises: Array<Promise<UploadApiResponse>> = []
      imagesProcessing(
        files,
        'assets/images/posts/images',
        'images',
        imagePromises
      )
      const images = await Promise.all(imagePromises)
      images.forEach((image) => {
        eventImages.push(image.public_id)
      })
    }

    if (
      typeof eventImageQueries.public_id !== 'undefined' &&
      typeof eventImageQueries.public_id === 'string'
    ) {
      const publicId = `assets/images/posts/images/${eventImageQueries.public_id}`
      eventImages = eventImages.filter((image) => image !== publicId)
      await deleteImagesFromCloudinary(publicId, 'image')
    }

    if (
      typeof eventImageQueries.public_id !== 'undefined' &&
      Array.isArray(eventImageQueries.public_id)
    ) {
      for (let publicId of eventImageQueries.public_id) {
        publicId = `assets/images/posts/images/${publicId}`
        eventImages = eventImages.filter((image) => image !== publicId)
        await deleteImagesFromCloudinary(publicId, 'image')
      }
    }

    const data: eventUpdateParams = {
      ...eventUpdateData,
      images: eventImages,
      thumbnail: eventThumbnail?.public_id
    }

    return (await this._eventModel.findByIdAndUpdate(eventId, data, {
      new: true
    })) as IEvent
  }

  deleteEventAndComments = async (
    eventId: string,
    userId: string,
    role: string,
    ...args: string[]
  ): Promise<void> => {
    await execTx(async (session) => {
      const event = await this.getEventById(eventId)
      const author = event.author as unknown as IUser

      if (author.id !== userId && !args.includes(role))
        throw new UtilsError('you are not allowed to perform this request', 403)

      const comments = event.comments as unknown as IComment[]
      await Promise.all(
        comments.filter(async (comment): Promise<void> => {
          await this._commentServices.deleteById(comment.id)
        })
      )

      const images: string[] = []
      if (event.thumbnail !== undefined) {
        images.push(event.thumbnail)
      }

      if (event?.images !== undefined) {
        images.push(...event?.images)
      }

      const promiseToResolve: Array<Promise<void>> = []
      if (images.length !== undefined) {
        images?.forEach((image) => {
          promiseToResolve.push(deleteImagesFromCloudinary(image, 'image'))
        })
      }

      promiseToResolve.push(this.deleteEvent(eventId))
      await Promise.all(promiseToResolve)
      await session.commitTransaction()
    })
  }
}

export default EventServices
