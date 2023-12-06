// import postModel from '../models/post-model'
import type mongoose from 'mongoose'
import { catchAsync } from '../utils/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import postModel from '../models/post-model'
import { imageProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'

export interface PostReqParams {
  headline: string
  article_body: string
  article_section: string
  citations?: string[]
  summary?: string
}

interface PostParams extends PostReqParams {
  author: mongoose.Schema.Types.ObjectId
  image?: string
}

export const createPost = catchAsync(
  async (
    req: Request<unknown, unknown, PostReqParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { _id } = req.user
    let imageData: UploadApiResponse | undefined
    if (req.file !== undefined) {
      imageData = (await imageProcessing(
        req,
        'assets/images/posts/thumbnails'
      )) as UploadApiResponse
    }

    const data: PostParams = {
      author: _id,
      ...req.body,
      image: imageData?.public_id
    }

    const post = await postModel.create(data)
    res.status(201).json({
      status: 'created',
      data: {
        post
      }
    })
  }
)
