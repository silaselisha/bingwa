import express, { type Router } from 'express'
import AuthController from '../controllers/auth-controller'
import RefreshTokenController from '../controllers/refresh_token-controller'
import JobScheduler, { uploadFiles } from '../util'
import userModel from '../models/user-model'
import sessionModel from '../models/session-model'
import AccessToken from '../util/token'
import AuthServices from '../services/auth-services'
import AuthMiddleware from '../middlewares/auth-middleware'
import UserController from '../controllers/user-controller'
import UserServices from '../services/user-services'
import SessionServices from '../services/session-services'

const router: Router = express.Router()
const accessToken = new AccessToken()
const userServices = new UserServices(userModel)
const authServices = new AuthServices(userModel)
const sessionServices = new SessionServices(sessionModel, accessToken)
const authController = new AuthController(
  authServices,
  sessionServices,
  accessToken
)
const jobScheduler = new JobScheduler(userServices)
const authMiddleware = new AuthMiddleware(accessToken)
const userController = new UserController(userServices, accessToken)
const refreshController = new RefreshTokenController(
  sessionServices,
  accessToken
)

router.post('/signup', authController.authSignupHandler)
router.post('/signin', authController.authSigninHandler)

router
  .route('/')
  .get(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('admin'),
    userController.getAllUsersHandler
  )

router
  .route('/reset-password')
  .put(authMiddleware.authMiddleware, userController.resetPasswordHandler)

router
  .route('/refresh-token')
  .put(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource(),
    refreshController.updateRefreshToken
  )

router
  .route('/reset-password/:resetToken')
  .put(userController.forgotPasswordResetHandler)

router
  .route('/domant-accounts')
  .get(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('admin'),
    userController.getAllInactiveAccountsHandler
  )

router
  .route('/:id')
  .get(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource('admin'),
    userController.getUserByIdHandler
  )
  .put(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource('admin'),
    uploadFiles.single('avatar'),
    userController.updateUserHandler
  )

router
  .route('/:id/deactivate')
  .put(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource('admin'),
    userController.deactivateUserHandler
  )

router
  .route('/:id/relationship')
  .post(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('user'),
    userController.userRelationshipHandler
  )

router
  .route('/:id')
  .delete(
    authMiddleware.authMiddleware,
    authMiddleware.protectResource('admin'),
    userController.deleteUserAccountHandler
  )

router.route('/forgot-password').post(userController.forgotPasswordHandler)

router.use('/verify/:token', userController.verifyAccountHandler)

void jobScheduler.deleteUserAccountsJob
export default router
