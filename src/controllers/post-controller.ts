import type mongoose from 'mongoose'
import { catchAsync } from '../utils/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import { imageProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'
import type PostServices from '../services/post-services'

export interface PostReqParams {
  headline: string
  article_body: string
  article_section: string
  citations?: string[]
  summary?: string
}

export interface postParams extends PostReqParams {
  author: mongoose.Schema.Types.ObjectId
  image?: string
}

class PostController {
  constructor (private readonly _postServices: PostServices) { }

  createPostHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { _id } = req.user
    let imageData: UploadApiResponse | undefined
    if (req.file !== undefined) {
      imageData = (await imageProcessing(
        req,
        'assets/images/posts/thumbnails'
      )) as UploadApiResponse
    }

    const data: postParams = {
      author: _id,
      ...req.body,
      image: imageData?.public_id
    }

    const post = await this._postServices.create(data)

    res.status(201).json({
      status: 'created',
      data: {
        post
      }
    })
  })
}

export default PostController
