import path from 'path'
import express, { type Response, type Request, type NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pino from 'pino'
import morgan from 'morgan'
import db from './utils/db'
import usersRouter from './routes/user-route'
import globalErrorHandler from './controllers/error-controller'
import UtilsError from './utils/app-error'

export const logger = pino()
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const port: string = process.env.PORT ?? '8080'
const app = express()
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''

process.env?.NODE_ENV === 'development' ? app.use(morgan('dev')) : app.use(morgan('combined'))

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/v1/users', usersRouter)
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new UtilsError('server route not implemented', 500))
})
app.use(globalErrorHandler)

app.listen(port, () => {
  void db(URI)
  logger.info(`Listening http://localhost:${port}`)
})
