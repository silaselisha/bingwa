import { Worker } from 'worker_threads'
import path from 'path'

import { logger } from '../app'
export interface optionsType {
  host: string
  port: number
}

export const rateLimiterWorker = (): void => {
  const options: optionsType = {
    port: parseInt(process.env.REDIS_PORT as string, 10),
    host: process.env.REDIS_HOST as string
  }

  const worker = new Worker(path.join(__dirname, 'redis-rlm-script'), {
    workerData: {
      ...options,
      maxBucketSize: process.env.RLM_MAX_BUCKET_SIZE,
      refillTimeSec: process.env.RLM_BUCKET_REFILL_TIME_SEC,
      refillTimeMin: process.env.RLM_BUCKET_REFILL_TIME_MIN,
      refillRate: process.env.RLM_REFILL_RATE
    }
  })

  worker.on('message', (msg) => {
    logger.info(msg)
  })
  worker.on('error', (err) => {
    logger.error(err)
  })
}
