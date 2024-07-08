import express from 'express'
import AccessToken from '../util/token'
import AuthMiddleware from '../middlewares/auth-middleware'
import LikeController from '../controllers/like-controller'
import LikeServices from '../services/like-services'
import likeModel from '../models/like-model'
import EventServices from '../services/event-services'
import eventModel from '../models/event-model'
import CommentServices from '../services/comment-services'
import commentModel from '../models/comment-model'

const router = express.Router({ mergeParams: true })

const accessToken = new AccessToken()
const authMiddleware = new AuthMiddleware(accessToken)
const likeServices = new LikeServices(likeModel)
const commentServices = new CommentServices(commentModel)
const eventServices = new EventServices(eventModel, commentServices)
const likeController = new LikeController(likeServices, eventServices)

router
  .route('/')
  .get(authMiddleware.authMiddleware, likeController.getAllEventLikes)
  .post(
    authMiddleware.authMiddleware,
    authMiddleware.restrictResourceTo('user'),
    likeController.reactToAnEventHandler
  )

export default router
