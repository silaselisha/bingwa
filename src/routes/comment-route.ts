/* eslint-disable @typescript-eslint/no-misused-promises */
import express from 'express'
import { createComment, getAllComments } from '../controllers/comment-controller'

const router = express.Router({ mergeParams: true })
router.route('/')
  .get(getAllComments)
  .post(createComment)

export default router
