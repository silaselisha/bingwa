/* eslint-disable @typescript-eslint/no-misused-promises */
import express from 'express'
import { createComment } from '../controllers/comment-controller'

const router = express.Router({ mergeParams: true })
router.route('/').post(createComment)

export default router
