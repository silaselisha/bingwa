import express from 'express'
import { createComment, deleteCommentById, getAllComments } from '../controllers/comment-controller'

const router = express.Router({ mergeParams: true })
router.route('/')
  .get(getAllComments)
  .post(createComment)

router.route('/:commentId').delete(deleteCommentById)

export default router
