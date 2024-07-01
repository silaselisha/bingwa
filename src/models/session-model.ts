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

export type sessionParams = {
  token: String
  user_agent: String
  client_ip: String
  isExpired: Boolean
  user: mongoose.Schema.Types.ObjectId
}

interface ISessionMethods {}

export type SessionModel = mongoose.Model<ISession, {}, ISessionMethods>

const sessionSchema = new mongoose.Schema<
  ISession,
  SessionModel,
  ISessionMethods
>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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

const Session = mongoose.model<ISession, SessionModel>('session', sessionSchema)
export default Session
