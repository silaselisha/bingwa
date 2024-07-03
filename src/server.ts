import os from 'os'
import cluster from 'cluster'
import process from 'process'

import { v2 as cloudinary } from 'cloudinary'
import app from './app'
import Database from './store'
import { createClient, type RedisClientType } from 'redis'
import { winstonLogger } from './util'

const port: string = process.env.PORT as string
const DB_PASSWORD: string = process.env?.DB_PASSWORD as string
const URI: string = process.env.DB_URI?.replace(
  '<password>',
  DB_PASSWORD
) as string
export let client: RedisClientType

const numCPUs = os.availableParallelism() 

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`)

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} shutdown`)
  })
} else {
  void (async (): Promise<void> => {
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
      winstonLogger('info', 'combined.log').info(
        `Listening http://localhost:${port}`
      )
    })
    console.log(`process ${process.pid} started`)
  })()
}