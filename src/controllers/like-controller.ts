import { type Request, type Response, type NextFunction } from 'express'
import type LikeServices from '../services/like-services'
import { catchAsync } from '../utils/app-error'
import { type IUser } from '../models/user-model'
import type PostServices from '../services/post-services'
import { type IPost } from '../models/post-model'
import type mongoose from 'mongoose'
import { likeTypeEnum } from '../models/like-model'

export interface likeParams extends likeTypeParams {
  user: mongoose.Schema.Types.ObjectId
  post: mongoose.Schema.Types.ObjectId
}
export interface likeTypeParams {
  likeType: likeTypeEnum
}

/**
 * @todo
 * delete a like/dislike
 * this happens when a client double clicks on like/dislike button
 */

class LikeController {
  constructor (private readonly _likeServices: LikeServices, private readonly _postServices: PostServices) { }

  getAllPostLike = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { post_id: postId } = req.params
    const post = (await this._postServices.getPostById(postId)).depopulate()

    /**
     * @todo
     * perform datbase aggregation to know how many likes & dislikes * are in a single post
     */
    const likes = await this._likeServices.getAllPostLikes(post, likeTypeEnum.like)
    res.status(200).json({
      status: 'OK',
      data: {
        records: likes.length,
        likes
      }
    })
  })

  reactToPostHandler = catchAsync(async (req: Request<any, any, likeTypeParams>, res: Response, next: NextFunction): Promise<void> => {
    const user: IUser = req.user
    const action = req.query.action as likeTypeEnum
    const { post_id: postId } = req.params

    const post: IPost = (await this._postServices.getPostById(postId))

    await this._likeServices.reactToAPost(user, post, action)

    res.status(201).json({
      status: 'created'
    })
  })
}

export default LikeController
