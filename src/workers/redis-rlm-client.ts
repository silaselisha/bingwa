import { type RedisClientType, createClient } from 'redis'
import { type optionsType } from './redis-rlm-worker'

export const BUCKET_TOKEN_KEY: string = 'rate-limiter-bucket:token'
export const POST_IMAGES: string = 'post-iamges:cloudinary'

const redisClient = async (
  args: optionsType,
  init: any
): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    socket: {
      ...args
    }
  })

  await client.connect()
  return client
}

export default redisClient
