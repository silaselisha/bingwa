import express, { type Router } from 'express'
import AuthController from '../controllers/auth-controller'
import { uploadFiles } from '../utils'
import userModel from '../models/user-model'
import AccessToken from '../utils/token'
import AuthServices from '../services/auth-services'
import AuthMiddleware from '../middlewares/auth-middleware'
import UserController from '../controllers/user-controller'
import UserServices from '../services/user-services'

const router: Router = express.Router()
const accessToken = new AccessToken()
const userServices = new UserServices(userModel)
const authServices = new AuthServices(userModel)
const authMiddleware = new AuthMiddleware(accessToken)
const userController = new UserController(userServices)
const authController = new AuthController(authServices, accessToken)

router.post('/signup', authController.authSignupHandler)
router.post('/signin', authController.authSigninHandler)

router.route('/').get(authMiddleware.authMiddleware, authMiddleware.restrictResourceTo('admin'), userController.getAllUsersHandler)
router
  .route('/:id')
  .get(authMiddleware.authMiddleware, authMiddleware.restrictResourceTo('admin'), userController.getUserByIdHnadler)
  .put(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource('admin'),
    uploadFiles.single('avatar'),
    userController.updateUserHandler
  )

/**
 * @todo
 * deactivate account and deleted in 30 days when user does not login back
 */
router
  .route('/:id/deactivate')
  .put(authMiddleware.authMiddleware, authMiddleware.protectResource('admin', 'user'), userController.deactivateUserHandler)

export default router
