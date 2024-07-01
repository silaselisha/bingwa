import mongoose from 'mongoose'

interface ISession extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId
  token: string
  user_agent: string
  client_ip: string
  isExpired: boolean
  created_at: Date
  updated_at: Date
}

const sessionSchema = new mongoose.Schema<ISession, {}, {}>(
  {
    user: mongoose.Schema.Types.ObjectId,
    token: String,
    user_agent: String,
    client_ip: String,
    isExpired: Boolean,
    created_at: Date,
    updated_at: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
)

const Session = mongoose.model('session', sessionSchema)
export default Session
