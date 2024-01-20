import { v2 as cloudinary } from 'cloudinary'
import app from './app'
import Database from './store'
import { createClient, type RedisClientType } from 'redis'
import winstonLogger from './util/logger'

const port: string = process.env.PORT ?? '8080'
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''
export let client: RedisClientType

export const logger = winstonLogger('info', 'combined.log')

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
    const database = new Database(URI)
    await database.start()
    logger.info(`Listening http://localhost:${port}`)
  })
}

void start()
