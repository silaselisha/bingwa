import express, { type Router } from 'express'
import { authSignupHandler } from '../controllers/auth-controller'

const router: Router = express.Router()

router.post('/signup', authSignupHandler)

export default router
