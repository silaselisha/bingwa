import { type Request, type Response, type NextFunction } from 'express'
import { client } from '../server'
import UtilsError, {
  type AsyncMiddlewareFunc,
  catchAsync
} from '../util/app-error'
import { BUCKET_TOKEN_KEY } from '../workers/redis-rlm-client'

/**
 * @summary
 * --------------------------------------------------------------
 * token 1 removed from the bucket
 * token 2 removed from the bucket after 30 minitues
 * since the removal of the first token
 * The wait time now is 1hr30min for the bucket to be full
 * --------------------------------------------------------------
 */

const rateLimiterMiddleware = (): AsyncMiddlewareFunc => {
  return catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const bucket = await client.HGETALL(BUCKET_TOKEN_KEY)
      const refillRate: number = parseInt(
        process.env.RLM_REFILL_RATE as string,
        10
      )

      if (parseInt(bucket.bucket, 10) <= 0) { throw new UtilsError('too many requests', 429) }

      const counter = parseInt(bucket.counter, 10)
      if (parseInt(bucket.bucket, 10) === counter) { throw new UtilsError('too many requests', 429) }

      let token = await client.HGETALL(`token-${counter + 1}`)
      token = {
        ...token,
        timestamp: `${Math.floor(Date.now() / 1000)}`,
        isActive: 'false'
      }
      await client.HSET(`token-${counter + 1}`, token)

      await client.HSET(BUCKET_TOKEN_KEY, {
        counter: counter + refillRate
      })

      next()
    }
  )
}

export default rateLimiterMiddleware
