import express from 'express'
import CommentController from '../controllers/comment-controller'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'

const router = express.Router({ mergeParams: true })

const commentServices = new CommentServices(commentModel)
const commentController = new CommentController(commentServices)

router.route('/').get(commentController.getAllCommentsHandler).post(commentController.createCommentHandler)

router.route('/:commentId').delete(commentController.deleteCommentByIdHandler)

export default router
