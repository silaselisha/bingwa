import mongoose from 'mongoose'
import pino from 'pino'
import UtilsError from '../util/app-error'
import { client } from '../server'

const logger = pino()

class Database {
  constructor (private readonly _db_uri: string) {}

  start = async (): Promise<void> => {
    try {
      await mongoose.connect(this._db_uri)
      logger.info('Database connection successfully...')
    } catch (error) {
      logger.error(error)
    }
  }
}

export const execTx = async (
  cb: (session: mongoose.mongo.ClientSession) => Promise<void>
): Promise<void> => {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await cb(session)
    })
    await session.commitTransaction()
  } catch (error: any) {
    if (session !== undefined && session.inTransaction()) {
      await session.abortTransaction()
    }
    throw new UtilsError(error?.message, error.statusCode)
  } finally {
    if (session !== undefined) {
      await session.endSession()
    }
  }
}

export const tokenResetDataStore = async (_id: string, _token: string, _timestamp: number): Promise<void> => {
  const data = { token: _token, timestamp: _timestamp, id: _id }
  await client.hSet(_token, data)
}

export default Database
