import { v2 as cloudinary } from 'cloudinary'
import * as cron from 'cron'
import app, { logger } from './app'
import init from './utils/db'
import { createClient, type RedisClientType } from 'redis'
import { rateLimiterWorker } from './workers/redis-rlm-worker'

const port: string = process.env.PORT ?? '8080'
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''
export let client: RedisClientType

const start = async (): Promise<void> => {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST as string,
      port: parseInt(process.env.REDIS_PORT as string, 10)
    }
  })

  await client.connect()

  cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })

  app.listen(port, async (): Promise<void> => {
    await init(URI)
    logger.info(`Listening http://localhost:${port}`)
    cron.CronJob.from({
      cronTime: '*/5 * * * *',
      onTick: (): void => {
        rateLimiterWorker()
      },
      start: true
    })
  })
}

void start()
