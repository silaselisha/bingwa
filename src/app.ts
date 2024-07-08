import path from 'path'
import express, {
  type Response,
  type Request,
  type NextFunction
} from 'express'
import helmet from 'helmet'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'

import usersRouter from './routes/user-route'
import eventsRouter from './routes/event-route'
import likesRouter from './routes/like-route'
import commentsRouter from './routes/comment-route'
import globalErrorHandler from './controllers/error-controller'
import UtilsError from './util/app-error'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
process.env?.NODE_ENV === 'development'
  ? app.use(morgan('dev'))
  : app.use(morgan('combined'))

app.use(helmet())
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/v1/metric', (req, res, next) => {
  res.status(200).json({
    status: 'OK'
  })
})
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/events', eventsRouter)
app.use('/api/v1/vote', likesRouter)
app.use('/api/v1/comments', commentsRouter)
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new UtilsError('server route not implemented', 500))
})
app.use(globalErrorHandler)

export default app
