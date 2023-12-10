import express, { type Router } from 'express'
import {
  authSigninHandler,
  authSignupHandler
} from '../controllers/auth-controller'
import authMiddleware, {
  protectResource,
  restrictResourceTo
} from '../middlewares/auth-middleware'
import {
  getAllUsers,
  getUserById,
  updateUser
} from '../controllers/user-controller'
import { uploadFiles } from '../utils'

const router: Router = express.Router()

router.post('/signup', authSignupHandler)
router.post('/signin', authSigninHandler)

router.route('/').get(authMiddleware, restrictResourceTo('admin'), getAllUsers)
router
  .route('/:id')
  .get(authMiddleware, restrictResourceTo('admin'), getUserById)
  .put(
    authMiddleware,
    protectResource('admin'),
    uploadFiles.single('avatar'),
    updateUser
  )

export default router
