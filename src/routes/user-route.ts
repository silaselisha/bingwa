import express, { type Router } from 'express'
import AuthController from '../controllers/auth-controller'
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
import userModel from '../models/user-model'
import AccessToken from '../utils/token'
import AuthServices from '../services/auth-services'

const router: Router = express.Router()
const accessToken = new AccessToken()
const authServices = new AuthServices(userModel)
const authController = new AuthController(authServices, accessToken)

router.post('/signup', authController.authSignupHandler)
router.post('/signin', authController.authSigninHandler)

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

/**
 * @todo
 * deactivate account and deleted in 30 days when user does not login back
 */
router
  .route('/:id/deactivate')
  .put(authMiddleware, protectResource('admin', 'user'))

export default router
