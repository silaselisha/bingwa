import path from 'path'
import express, {
  type Response,
  type Request,
  type NextFunction
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pino from 'pino'
import morgan from 'morgan'

import usersRouter from './routes/user-route'
import postsRouter from './routes/post-route'
import globalErrorHandler from './controllers/error-controller'
import UtilsError from './utils/app-error'

export const logger = pino()
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()

process.env?.NODE_ENV === 'development'
  ? app.use(morgan('dev'))
  : app.use(morgan('combined'))

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/v1/users', usersRouter)
app.use('/api/v1/posts', postsRouter)
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new UtilsError('server route not implemented', 500))
})
app.use(globalErrorHandler)

export default app
