import { type RedisClientType, createClient } from 'redis'
import { logger } from '../app'

export const BUCKET_TOKEN_KEY: string = 'rate-limiter-bucket:token'

const redisClient = async (): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT as string, 10)
    }
  })
  await client.connect()

  const MAX_BUCKET_SIZE: number = 3
  const REFILL_RATE: number = 1
  const DEFAULT_TOKENS: number = 3
  const bucketInfo = await client.HGETALL(BUCKET_TOKEN_KEY)

  if (bucketInfo.max_bucket_size == null) {
    console.log('creating a bucket...')
    await client.HSET(BUCKET_TOKEN_KEY, {
      max_bucket_size: MAX_BUCKET_SIZE,
      refill_rate: REFILL_RATE,
      curr_bucket_size: DEFAULT_TOKENS,
      last_refill_timestamp: Math.floor(Date.now() / 1000)
    })
  }

  return client
}

export const rateLimiterRefillBucketToken = async (client: RedisClientType): Promise<void> => {
  const bucket = await client.HGETALL(BUCKET_TOKEN_KEY)
  const maxBucketSize: number = parseInt(bucket.max_bucket_size, 10)

  logger.warn(bucket)
  logger.warn(maxBucketSize)

  const currBucketSize: number = parseInt(bucket.curr_bucket_size, 10)
  const currTimeSec: number = Date.now() / 1000
  const timeElapsed: number = Math.floor(currTimeSec - parseInt(bucket.last_refill_timestamp, 10))
  const numTokensToAdd: number = Math.min(Math.floor(timeElapsed * parseInt(bucket.refill_rate, 10) / 30), maxBucketSize - currBucketSize)

  // logger.warn(`stats: ${Math.floor(timeElapsed * parseInt(bucket.refill_rate, 10))}`)
  // logger.warn(`elapsed time since last refill: ${timeElapsed}`)
  // logger.warn(`tokens to be added since last refill: ${numTokensToAdd}`)
  // logger.warn(`current bucket size: ${currBucketSize}`)

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
  if (currBucketSize < maxBucketSize) {
    await client.HSET(BUCKET_TOKEN_KEY, {
      curr_bucket_size: currBucketSize + numTokensToAdd,
      last_refill_timestamp: Math.floor(Date.now() / 1000)
    })
  }
}

export default redisClient
