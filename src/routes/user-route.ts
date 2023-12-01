/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express'
import { authSigninHandler, authSignupHandler } from '../controllers/auth-controller'

const router: Router = express.Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/signup', authSignupHandler)
router.post('/signin', authSigninHandler)

export default router
