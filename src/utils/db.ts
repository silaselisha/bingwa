import mongoose from 'mongoose'
import pino from 'pino'

const logger = pino()
const db = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri, { heartbeatFrequencyMS: 1000 })
    logger.info('database connection successful...')
  } catch (err) {
    logger.error(err)
  }
}

export default db
