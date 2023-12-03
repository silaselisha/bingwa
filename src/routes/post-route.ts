/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express'
import authMiddleware from '../middlewares/auth-middleware'
import { createPost } from '../controllers/post-controller'

const router: Router = express.Router()
router.route('/').post(authMiddleware, createPost)

export default router
