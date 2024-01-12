import express, { type Router } from 'express'
import { uploadFiles } from '../util'
import likesRouter from './like-route'
import commentsRouter from './comment-route'
import AuthMiddleware from '../middlewares/auth-middleware'
import AccessToken from '../util/token'
import PostController from '../controllers/post-controller'
import PostServices from '../services/post-services'
import postModel from '../models/post-model'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)

const router: Router = express.Router()
const commentServices = new CommentServices(commentModel)
const postServices = new PostServices(postModel, commentServices)
const postController = new PostController(postServices)

router
  .route('/')
  .get(authMiddleware.authMiddleware, postController.getAllPostHandler)
  .post(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('admin', 'user'),
    uploadFiles.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 6 }]),
    postController.createPostHandler
  )

router.use(
  '/:post_id/comments',
  authMiddleware.authMiddleware,
  authMiddleware.restrictResourceTo('user', 'admin'),
  commentsRouter
)

router.use(
  '/:post_id/vote',
  authMiddleware.authMiddleware,
  likesRouter
)

router
  .route('/:post_id')
  .get(authMiddleware.authMiddleware, postController.getPostHandler)
  .put(authMiddleware.authMiddleware, authMiddleware.restrictResourceTo('user'), uploadFiles.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 6 }]), postController.updatePostHandler)
  .delete(authMiddleware.authMiddleware, postController.deletePostHandler)

export default router
