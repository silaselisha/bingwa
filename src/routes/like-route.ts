import express from 'express'
import AccessToken from '../util/token'
import AuthMiddleware from '../middlewares/auth-middleware'
import LikeController from '../controllers/like-controller'
import LikeServices from '../services/like-services'
import likeModel from '../models/like-model'
import PostServices from '../services/post-services'
import postModel from '../models/post-model'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'

const router = express.Router({ mergeParams: true })

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)
const likeServices = new LikeServices(likeModel)
const commentServices = new CommentServices(commentModel)
const postServices = new PostServices(postModel, commentServices)
const likeController = new LikeController(likeServices, postServices)

router
  .route('/')
  .get(authMiddleware.authMiddleware, likeController.getAllPostLike)
  .post(authMiddleware.authMiddleware, authMiddleware.restrictResourceTo('user'), likeController.reactToPostHandler)

export default router
