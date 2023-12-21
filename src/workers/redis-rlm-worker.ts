import { Worker } from 'worker_threads'
import path from 'path'

import { logger } from './redis-rlm-script'

export interface optionsType {
  host: string
  port: number
}

export const rateLimiterWorker = async (): Promise<void> => {
  const options: optionsType = {
    port: parseInt(process.env.REDIS_PORT as string, 10),
    host: process.env.REDIS_HOST as string
  }

  const worker = new Worker(path.join(__dirname, 'redis-rlm-script'), {
    workerData: {
      ...options
    }
  })

  logger.info(options)

  worker.on('message', (msg) => { logger.info(msg) })
  worker.on('error', (err) => { logger.error(err) })
}
