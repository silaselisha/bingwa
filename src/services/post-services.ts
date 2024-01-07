import type mongoose from 'mongoose'
import { type postInfoParams } from '../controllers/post-controller'
import { type IPost, type PostModel } from '../models/post-model'
import { type IUser } from '../models/user-model'
import UtilsError from '../utils/app-error'
import { execTx } from '../utils/db'
import type CommentServices from './comment-services'
import { type IComment } from '../models/comment-model'
import { deleteImagesFromCloudinary } from '../utils'

class PostServices {
  constructor (private readonly _postModel: PostModel, private readonly _commentServices: CommentServices) {}

  create = async (data: postInfoParams): Promise<IPost> => {
    const post: IPost = await this._postModel.create(data)
    if (post === null) throw new UtilsError('internal server error', 500)
    return post
  }

  getPostById = async (postId: string, session?: mongoose.mongo.ClientSession): Promise<IPost> => {
    const post = await this._postModel.findById(postId)
      .populate({ path: 'author', select: { username: true, image: true } })
      .populate({ path: 'comments', populate: { path: 'author', select: { username: true, image: true, role: true } } }).session(session) as IPost

    if (post === null) throw new UtilsError('post not found', 404)
    return post
  }

  getAllPosts = async (): Promise<IPost[]> => {
    return await this._postModel.find({})
      .populate({ path: 'author', select: { username: true, image: true, role: true } })
      .populate({ path: 'comments', populate: { path: 'author', select: { username: true, image: true } } }) as IPost[]
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
    })
  }

  deletePost = async (postId: string): Promise<void> => {
    await this._postModel.findByIdAndDelete(postId)
  }
}

export default PostServices
