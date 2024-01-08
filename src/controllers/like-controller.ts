import { type Request, type Response, type NextFunction } from 'express'
import type LikeServices from '../services/like-services'
import { catchAsync } from '../utils/app-error'
import { type IUser } from '../models/user-model'
import type PostServices from '../services/post-services'
import { type IPost } from '../models/post-model'

export interface likeParams {
  likeType: boolean
}

class LikeController {
  constructor (private readonly _likeServices: LikeServices, private readonly _postServices: PostServices) { }
  reactToPostHandler = catchAsync(async (req: Request<any, any, likeParams>, res: Response, next: NextFunction): Promise<void> => {
    const user: IUser = req.user
    const { likeType } = req.body
    const { post_id: postId } = req.params

    const post: IPost = (await this._postServices.getPostById(postId)).depopulate()
    await this._likeServices.reactToAPost(user, post, likeType)

    res.status(201).json({
      status: 'created'
    })
  })
}

export default LikeController
