import { parentPort, workerData } from 'worker_threads'
import pino from 'pino'
import redisClient, { BUCKET_TOKEN_KEY } from './redis-rlm-client'

export const logger = pino()

export const rateLimiterRefillBucketToken = async (): Promise<void> => {
  const client = await redisClient(workerData?.options)
  logger.warn(workerData)
  logger.info(`Listening http://localhost:${workerData?.port}`)

  const bucket = await client.HGETALL(BUCKET_TOKEN_KEY)
  const maxBucketSize: number = parseInt(bucket.max_bucket_size, 10)

  logger.warn(bucket)
  logger.warn(maxBucketSize)

  const currBucketSize: number = parseInt(bucket.bucket, 10)
  const currTimeSec: number = Date.now() / 1000
  const timeElapsed: number = Math.floor(currTimeSec - parseInt(bucket.last_refill_timestamp, 10))
  const numTokensToAdd: number = Math.min(Math.floor(timeElapsed * parseInt(bucket.refill_rate, 10) / 60), maxBucketSize - currBucketSize)

  logger.warn(`stats: ${Math.floor(timeElapsed * parseInt(bucket.refill_rate, 10))}`)
  logger.warn(`elapsed time since last refill: ${timeElapsed}`)
  logger.warn(`tokens to be added since last refill: ${numTokensToAdd}`)
  logger.warn(`current bucket size: ${currBucketSize}`)

  /**
   * @summary
   * token 1 is removed at minute one & a token is added after 1 hour
   * since it's removal.
   * token 2 is removed at minute 20 after the removal of the 1st token
   * ------------------------------------------------------------------
   * SOLUTION
   * ------------------------------------------------------------------
   * last refill timestamp - it's gonna be the one in our redis DB
   * and it should be updated in 61 minutes
   * second token refill timestamp - 20minute  60 + 1 + 40 + 20 = 121 minutes
   */
  parentPort?.postMessage('background worker')
  if (currBucketSize < maxBucketSize) {
    await client.HSET(BUCKET_TOKEN_KEY, {
      bucket: currBucketSize + numTokensToAdd,
      last_refill_timestamp: Math.floor(Date.now() / 1000)
    })
  }
}

void rateLimiterRefillBucketToken()
