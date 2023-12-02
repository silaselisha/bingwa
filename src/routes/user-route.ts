/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express'
import {
  authSigninHandler,
  authSignupHandler
} from '../controllers/auth-controller'
import authMiddleware from '../middlewares/auth-middleware'
import { getAllUsers } from '../controllers/user-controller'

const router: Router = express.Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/signup', authSignupHandler)
router.post('/signin', authSigninHandler)

router.route('/').get(authMiddleware, getAllUsers)

export default router
