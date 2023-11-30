import express, { type Router } from 'express'
import { authSignupHandler } from '../controllers/auth-controller'

const router: Router = express.Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/signup', authSignupHandler)

export default router
