import type mongoose from 'mongoose'
import { type postParams, type postInfoParams } from '../controllers/post-controller'
import { type IPost, type PostModel } from '../models/post-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../util/app-error'
import { execTx } from '../store'
import type CommentServices from './comment-services'
import { type IComment } from '../models/comment-model'
import { deleteImagesFromCloudinary, imagesProcessing } from '../util'
import { type UploadApiResponse } from 'cloudinary'
import Tooling from '../util/api-tools'

export interface postUpdateParams {
  headline?: string
  article_body?: string
  article_section?: string
  thumbnail?: string
  images?: string[]
  summary?: string
  citations?: string[]
}

class PostServices {
  constructor (private readonly _postModel: PostModel, private readonly _commentServices: CommentServices) { }

  createPost = async (updatesData: postParams, files: Record<string, Express.Multer.File[]>, user: IUser): Promise<IPost> => {
    let postThumbnail: UploadApiResponse | undefined
    const postImages: string[] = []
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
      ...updatesData,
      author: user._id,
      images: postImages,
      thumbnail: postThumbnail?.public_id
    }

    const post: IPost = await this._postModel.create(data)
    if (post === null) throw new UtilsError('internal server error', 500)
    return post
  }

  getPostById = async (postId: string, session?: mongoose.mongo.ClientSession): Promise<IPost> => {
    const post = await this._postModel.findById(postId)
      .populate({ path: 'author', select: { username: true, image: true } })
      .populate({ path: 'comments', populate: { path: 'author', select: { username: true, image: true, role: true } } }).populate({ path: 'likes', populate: { path: 'user', select: { username: true, image: true } } }).session(session) as IPost

    if (post === null) throw new UtilsError('post not found', 404)
    return post
  }

  getAllPosts = async (offset: number, limit: number): Promise<IPost[]> => {
    const tooling = new Tooling(this._postModel.find({}))
    const apiPagination = await (await (await tooling.pagination(offset, limit)).populate('author', { username: true, image: true }, '')).populate('comments', '', { path: 'author', select: { username: true, image: true } })

    const posts = await apiPagination._query as IPost[]
    return posts
  }

  deletePost = async (postId: string): Promise<void> => {
    await this._postModel.findByIdAndDelete(postId)
  }

  updatePostInfoById = async (updatesData: postUpdateParams, user: IUser, postId: string, files: Record<string, Express.Multer.File[]>, postImageQueries: any): Promise<IPost> => {
    const post: IPost = (await this.getPostById(postId)).depopulate()
    if (user._id.equals(post.author) !== true) throw new UtilsError('not allowed to perform this request', 403)

    let postThumbnail: UploadApiResponse | undefined
    let postImages: string[] = post.images as string[]

    if (files?.thumbnail !== undefined) {
      const imagePromises: Array<Promise<UploadApiResponse>> = []
      imagesProcessing(files, 'assets/images/posts/thumbnails', 'thumbnail', imagePromises)
      const images = await Promise.all(imagePromises)
      postThumbnail = images.shift()

      post.thumbnail !== undefined && await deleteImagesFromCloudinary(post.thumbnail, 'image')
    }

    if (files.images !== undefined) {
      const imagePromises: Array<Promise<UploadApiResponse>> = []
      imagesProcessing(files, 'assets/images/posts/images', 'images', imagePromises)
      const images = await Promise.all(imagePromises)
      images.forEach((image) => {
        postImages.push(image.public_id)
      })
    }

    if (typeof postImageQueries.public_id !== 'undefined' && typeof postImageQueries.public_id === 'string') {
      const publicId = `assets/images/posts/images/${postImageQueries.public_id}`
      postImages = postImages.filter(image => image !== publicId)
      await deleteImagesFromCloudinary(publicId, 'image')
    }

    if (typeof postImageQueries.public_id !== 'undefined' && Array.isArray(postImageQueries.public_id)) {
      postImageQueries.public_id.forEach(async (publicId: string) => {
        publicId = `assets/images/posts/images/${publicId}`
        postImages = postImages.filter(image => image !== publicId)
        await deleteImagesFromCloudinary(publicId, 'image')
      })
    }

    const data: postUpdateParams = {
      ...updatesData,
      images: postImages,
      thumbnail: postThumbnail?.public_id
    }

    return await this._postModel.findByIdAndUpdate(postId, data, { new: true }) as IPost
  }

  deletePostAndComments = async (postId: string, userId: string, role: string, ...args: string[]): Promise<void> => {
    await execTx(async (session) => {
      const post = await this.getPostById(postId)
      const author = post.author as unknown as IUser

      if (author.id !== userId && !args.includes(role)) throw new UtilsError('you are not allowed to pefrorm this request', 403)

      const comments = post.comments as unknown as IComment[]
      await Promise.all(comments.filter(async (comment): Promise<void> => {
        await this._commentServices.deleteById(comment.id)
      }))

      const images: string[] = []
      if (post.thumbnail !== undefined) {
        images.push(post.thumbnail)
      }

      if (post?.images !== undefined) {
        images.push(...post?.images)
      }

      const promiseToResolve: Array<Promise<void>> = []
      if (images.length !== undefined) {
        images.forEach(async (image) => {
          promiseToResolve.push(deleteImagesFromCloudinary(image, 'image'))
        })
      }

      promiseToResolve.push(this.deletePost(postId))
      await Promise.all(promiseToResolve)
      await session.commitTransaction()
    })
  }
}

export default PostServices
