import { v2 as cloudinary } from 'cloudinary'
import app, { logger } from './app'
import init from './utils/db'
import redisClient, { rateLimiterRefillBucketToken } from './utils/redis'
import { type RedisClientType } from 'redis'

const port: string = process.env.PORT ?? '8080'
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''
export let client: RedisClientType

app.listen(port, async (): Promise<void> => {
  void init(URI)
  client = await redisClient()
  cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })

  setInterval(async (): Promise<void> => {
    await rateLimiterRefillBucketToken(client)
  }, 3000 * 10)

  logger.info(process.env.CLOUDINARY_NAME)
  logger.info(`Listening http://localhost:${port}`)
  logger.info('Redis http://localhost:6379')
})
