import { parentPort, workerData } from 'worker_threads'
import redisClient, { BUCKET_TOKEN_KEY } from './redis-rlm-client'
import { type RedisClientType } from 'redis'

const MAX_BUCKET_SIZE: number = parseInt(
  workerData?.maxBucketSize as string,
  10
)
const REFILL_RATE: number = parseInt(workerData?.refillRate as string, 10)
const REFILL_TIME_SECS: number = parseInt(
  workerData?.refillTimeSec as string,
  10
)
const REFILL_TIME_MINS: number = parseFloat(workerData?.refillTimeMin as string)
const REFILL_TIME: number = REFILL_TIME_SECS * REFILL_TIME_MINS

/**
 * @summary
 * token 1 is removed at minute one & a token is added after 1 hour
 * since it's removal.
 * token 2 is removed at minute 20 after the removal of the 1st token
 */
const initializeBucket = async (
  num: number,
  client: RedisClientType
): Promise<void> => {
  const bucketTokens: any = {}
  for (let i = 1; i <= num; i++) {
    const name = `token-${i}`
    const data: any = {
      name,
      timestamp: Math.floor(Date.now() / 1000),
      isActive: 'true'
    }
    await client.HSET(name, data)
    bucketTokens[name] = name
  }

  const initializeBucketData = {
    counter: 0,
    max_bucket_size: MAX_BUCKET_SIZE,
    refill_rate: REFILL_RATE,
    bucket: await client.HSET('tokens', bucketTokens),
    last_refill_timestamp: Math.floor(Date.now() / 1000)
  }

  await client.HSET(BUCKET_TOKEN_KEY, initializeBucketData)
}

export const rateLimiterRefillBucketToken = async (): Promise<void> => {
  const client = await redisClient(workerData?.options, initializeBucket)
  const bucket = await client.HGETALL(BUCKET_TOKEN_KEY)

  if (bucket.max_bucket_size == null) {
    console.log('creating a bucket...')
    await initializeBucket(MAX_BUCKET_SIZE, client)
  }

  parentPort?.postMessage(workerData)
  parentPort?.postMessage(bucket)
  parentPort?.postMessage(`Listening http://localhost:${workerData?.port}`)

  let counter: number = parseInt(bucket.counter, 10)
  const currTimeSec: number = Math.floor(Date.now() / 1000)
  const currBucketSize: number = parseInt(bucket.bucket, 10)
  const timeElapsedOnFullBucket: number = Math.floor(
    currTimeSec - parseInt(bucket.last_refill_timestamp, 10)
  )

  parentPort?.postMessage('background worker')
  parentPort?.postMessage(`current counter: ${counter}`)
  parentPort?.postMessage(`current bucket size: ${currBucketSize - counter}`)
  parentPort?.postMessage(
    `elapsed time since last refill: ${timeElapsedOnFullBucket}`
  )

  if (counter > 0) {
    const tokens = counter
    const message = tokens > 1 ? 'tokens' : 'token'
    parentPort?.postMessage(`${tokens} ${message} to add in your bucket`)

    for (let i = 1; i <= currBucketSize; i++) {
      const token = await client.HGETALL(`token-${i}`)
      const timeElapsed = Math.floor(
        Math.floor(Date.now() / 1000) - parseInt(token?.timestamp, 10)
      )

      parentPort?.postMessage(`refill time in seconds: ${REFILL_TIME}`)
      parentPort?.postMessage(`${token.name} elapsed time: ${timeElapsed}`)

      if (token.isActive === 'false' && timeElapsed >= REFILL_TIME) {
        parentPort?.postMessage(`${token.name} now active to use`)
        const updatedToken = { ...token, isActive: 'true' }
        const updateBucket = {
          ...bucket,
          counter: `${counter - REFILL_RATE}`,
          last_refill_timestamp: Math.floor(Date.now() / 1000)
        }

        await client.HSET(token.name, updatedToken)
        await client.HSET(BUCKET_TOKEN_KEY, updateBucket)
        counter = counter - 1
      }
    }
  }
}

void rateLimiterRefillBucketToken()
