// import postModel from '../models/post-model'
import type mongoose from 'mongoose'
import { catchAsync } from '../utils/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import postModel from '../models/post-model'

export interface PostReqParams {
  headline: string
  article_body: string
  article_section: string
  citations?: string[]
  summary?: string
}

interface PostParams extends PostReqParams {
  user_id: mongoose.Schema.Types.ObjectId
  image?: string
}

export const createPost = catchAsync(
  async (
    req: Request<unknown, unknown, PostReqParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { _id } = req.user
    const data: PostParams = {
      user_id: _id,
      ...req.body
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
