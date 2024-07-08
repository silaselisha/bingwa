import express from 'express'
import CommentController from '../controllers/comment-controller'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'
import AuthMiddleware from '../middlewares/auth-middleware'
import AccessToken from '../util/token'

const router = express.Router({ mergeParams: true })

const commentServices = new CommentServices(commentModel)
const commentController = new CommentController(commentServices)

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)

router
  .route('/')
  .get(authMiddleware.authMiddleware, commentController.getAllCommentsHandler)
  .post(
    authMiddleware.restrictResourceTo('user'),
    commentController.createCommentHandler
  )

router.route('/:commentId').delete(commentController.deleteCommentByIdHandler)

export default router
