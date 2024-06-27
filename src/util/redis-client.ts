import { type RedisClientType, createClient } from 'redis'

export const BUCKET_TOKEN_KEY: string = 'rate-limiter-bucket:token'
export const POST_IMAGES: string = 'post-images:cloudinary'

const redisClient = async (args: any): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    socket: {
      ...args
    }
  })

  await client.connect()
  return client
}

export default redisClient
