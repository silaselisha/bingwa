import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ auth: { enable: false } })
  const uri: string = mongod.getUri()
  await mongoose.connect(uri, { dbName: 'portfolio' })
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()

  for (const collection of collections) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  await mongod.stop({ doCleanup: true })
  await mongoose.connection.close()
})
