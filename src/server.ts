import { v2 as cloudinary } from 'cloudinary'
import app, { logger } from './app'
import init from './utils/db'

const port: string = process.env.PORT ?? '8080'
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''

app.listen(port, (): void => {
  void init(URI)
  cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
  logger.info(process.env.CLOUDINARY_NAME)
  logger.info(`Listening http://localhost:${port}`)
})
