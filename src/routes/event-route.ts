import express, { type Router } from 'express'
import { uploadFiles } from '../util'
import likesRouter from './like-route'
import commentsRouter from './comment-route'
import AuthMiddleware from '../middlewares/auth-middleware'
import AccessToken from '../util/token'
import PostController from '../controllers/event-controller'
import EventServices from '../services/event-services'
import eventModel from '../models/event-model'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)

const router: Router = express.Router()
const commentServices = new CommentServices(commentModel)
const eventServices = new EventServices(eventModel, commentServices)
const eventController = new PostController(eventServices)

router
  .route('/')
  .get(authMiddleware.authMiddleware, eventController.getAllEventHandler)
  .post(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('admin', 'user'),
    uploadFiles.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 6 }
    ]),
    eventController.createEventHandler
  )

router.use(
  '/:event_id/comments',
  authMiddleware.authMiddleware,
  authMiddleware.restrictResourceTo('user', 'admin'),
  commentsRouter
)

router.use('/:event_id/vote', authMiddleware.authMiddleware, likesRouter)

router
  .route('/:event_id')
  .get(authMiddleware.authMiddleware, eventController.getEventHandler)
  .put(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('user'),
    uploadFiles.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 6 }
    ]),
    eventController.updateEventHandler
  )
  .delete(authMiddleware.authMiddleware, eventController.deleteEventHandler)

export default router
