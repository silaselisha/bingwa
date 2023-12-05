/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express'
import { createPost } from '../controllers/post-controller'
import { uploadFiles } from '../utils'
import commentsRouter from './comment-route'
import authMiddleware, {
  restrictResourceTo
} from '../middlewares/auth-middleware'

const router: Router = express.Router()
router
  .route('/')
  .post(authMiddleware, uploadFiles.single('thumbnail'), createPost)

router.use(
  '/:post_id/comments',
  authMiddleware,
  restrictResourceTo('admin', 'user'),
  commentsRouter
)
export default router
