import { type RedisClientType, createClient } from 'redis'
import { type optionsType } from './redis-rlm-worker'

export const BUCKET_TOKEN_KEY: string = 'rate-limiter-bucket:token'

const redisClient = async (args: optionsType): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    socket: {
      ...args
    }
  })
  await client.connect()
  const bucketInfo = await client.HGETALL(BUCKET_TOKEN_KEY)
  /**
   * @todo
   * rename curr_bucket_size to bucket ✅
   * make the bucket a hash table { token, timestamp, active}
   * create a counter variable
   */
  if (bucketInfo.max_bucket_size == null) {
    console.log('creating a bucket...')
    await client.HSET(BUCKET_TOKEN_KEY, {
      max_bucket_size: parseInt(process.env.RLM_MAX_BUCKET_SIZE as string, 10),
      refill_rate: parseInt(process.env.RLM_REFILL_RATE as string, 10),
      bucket: parseInt(process.env.RLM_DEFAULT_TOKENS as string, 10),
      last_refill_timestamp: Math.floor(Date.now() / 1000)
    })
  }

  return client
}

export default redisClient
