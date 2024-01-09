import type mongoose from 'mongoose'
import { catchAsync } from '../utils/app-error'
import { type Request, type Response, type NextFunction } from 'express'
import { imagesProcessing } from '../utils'
import { type UploadApiResponse } from 'cloudinary'
import type PostServices from '../services/post-services'
import { type postUpdateParams } from '../services/post-services'

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
    let postThumbnail: UploadApiResponse | undefined
    const postImages: string[] = []

    const files = req.files as Record<string, Express.Multer.File[]>
    const imagePromises: Array<Promise<UploadApiResponse>> = []

    imagesProcessing(files, 'assets/images/posts/thumbnails', 'thumbnail', imagePromises)

    imagesProcessing(files, 'assets/images/posts/images', 'images', imagePromises)

    const images = await Promise.all(imagePromises)
    if (files?.thumbnail !== undefined) {
      postThumbnail = images.shift()
    }

    if (files.images !== undefined) {
      images.forEach((image) => {
        postImages.push(image.public_id)
      })
    }

    const data: postInfoParams = {
      ...req.body,
      author: id,
      images: postImages,
      thumbnail: postThumbnail?.public_id
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

  updatePostHandler = catchAsync(async (req: Request<any, any, postUpdateParams>, res: Response, next: NextFunction): Promise<void> => {
    const { post_id: postId } = req.params
    let postThumbnail: UploadApiResponse | undefined

    let post = await this._postServices.getPostById(postId)

    const postImages: string[] = post.images as string[]
    const files = req.files as Record<string, Express.Multer.File[]>
    const imagePromises: Array<Promise<UploadApiResponse>> = []

    imagesProcessing(files, 'assets/images/posts/thumbnails', 'thumbnail', imagePromises)
    imagesProcessing(files, 'assets/images/posts/images', 'images', imagePromises)

    const images = await Promise.all(imagePromises)
    if (files?.thumbnail !== undefined) {
      /**
       * @todo
       * old thumbnail in REDIS to be deleted by workers
       */
      postThumbnail = images.shift()
    }

    if (files.images !== undefined) {
      /**
       * @todo
       * delete the old image from the array
       * save the old image public_id in redis to be deleted by workers
       */
      images.forEach((image) => {
        postImages?.push(image.public_id)
      })
    }

    const data: postUpdateParams = {
      ...req.body,
      images: postImages,
      thumbnail: postThumbnail?.public_id
    }

    post = await this._postServices.updatePostInfoById(data, req.user, postId)
    res.status(200).json({
      status: 'OK',
      data: { post }
    })
  })
}

export default PostController
