import { type Request, type Response, type NextFunction } from 'express'
import { client } from '../server'
import UtilsError, { type AsyncMiddlewareFunc, catchAsync } from '../utils/app-error'
import { logger } from '../app'
import { BUCKET_TOKEN_KEY } from '../workers/redis-rlm-client'

/**
 * @template
 * token buckets 3 MAX
 * refill rate 1 token per hour
 * --------------------------------------------------------------
 * EXAMPLE
 * --------------------------------------------------------------
 * token 1 removed from the bucket
 * token 2 removed from the bucket after 30 minitues
 * since the removal of the first token
 * * The wait time now is 1hr30min for the bucket to be full
 * --------------------------------------------------------------
 * Questions
 *
 * Do we have to wait for 1hr30min to fill the bucket or fill the * 1st token after 30 mintues and 2nd token after 1hour?
 *
 * Answers
 * yes, fill the first token after it's one hour has elapsed and * wait for another hour to fill the bucket with the second token
 */

const rateLimiterMiddleware = (): AsyncMiddlewareFunc => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bucket = await client.HGETALL(BUCKET_TOKEN_KEY)
    logger.warn(bucket)
    if (parseInt(bucket.bucket, 10) <= 0) throw new UtilsError('too many requests', 429)

    /**
     * @todo
     * update the bucket by { token, timestap[changes], active[false] }
     */
    await client.HSET(BUCKET_TOKEN_KEY, {
      bucket: parseInt(bucket.bucket, 10) - 1
      // last_refill_timestamp: Math.floor(Date.now() / 1000)
    })

    next()
  })
}

export default rateLimiterMiddleware
