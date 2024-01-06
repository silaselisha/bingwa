import type mongoose from 'mongoose'
import { catchAsync } from '../utils/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import { imageProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'
import type PostServices from '../services/post-services'

export interface postParams {
  headline: string
  article_body: string
  article_section: string
  citations?: string[]
  summary?: string
}

export interface postInfoParams extends postParams {
  author: mongoose.Schema.Types.ObjectId
  thumbnail?: string
  images?: string[]
}

/**
 * @todo
 * concurrently delete a post with it's comments 🔥
 * update a post information 🔥
 * bookmark a post 🔥
 * like/upvote disklike/downvote a post 🔥
 * pagination & sorting posts 🔥
 * search functionality for posts 🔥
 * post tags/category 🔥
 */

class PostController {
  constructor (private readonly _postServices: PostServices) { }

  deletePostHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { post_id: postId } = req.params
    await this._postServices.deletePostAndComments(postId, req.user.id, req.user.role, 'admin')

    res.status(204).json({
      status: 'no content'
    })
  })

  createPostHandler = catchAsync(async (req: Request<any, any, postParams>, res: Response, next: NextFunction): Promise<void> => {
    const { _id: id } = req.user
    let imageData: UploadApiResponse | undefined
    /**
     * @todo
     * process thumbnail image
     * process images
     */
    if (req.file !== undefined) {
      imageData = (await imageProcessing(
        req.file.buffer,
        'assets/images/posts/thumbnails'
      )) as UploadApiResponse
    }

    const data: postInfoParams = {
      ...req.body,
      author: id,
      thumbnail: imageData?.public_id
    }

    const post = await this._postServices.create(data)

    res.status(201).json({
      status: 'created',
      data: {
        post
      }
    })
  })

  getAllPostHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const posts = await this._postServices.getAllPosts()

    res.status(200).json({
      status: 'OK',
      records: posts.length,
      data: { posts }
    })
  })

  getPostHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { post_id: postId } = req.params
    const post = await this._postServices.getPostById(postId)

    res.status(200).json({
      status: 'OK',
      data: { post }
    })
  })
}

export default PostController
