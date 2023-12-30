import express, { type Router } from 'express'
import { uploadFiles } from '../utils'
import commentsRouter from './comment-route'
import AuthMiddleware from '../middlewares/auth-middleware'
import AccessToken from '../utils/token'
import PostController from '../controllers/post-controller'
import PostServices from '../services/post-services'
import postModel from '../models/post-model'

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)

const router: Router = express.Router()
const postServices = new PostServices(postModel)
const postController = new PostController(postServices)
router
  .route('/')
  .post(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('admin', 'user'),
    uploadFiles.single('thumbnail'),
    postController.createPostHandler
  )

router.use(
  '/:post_id/comments',
  authMiddleware.authMiddleware,
  authMiddleware.restrictResourceTo('user'),
  commentsRouter
)

export default router
