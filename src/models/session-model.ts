import mongoose from 'mongoose'

export interface ISession extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId
  token: string
  user_agent: string
  client_ip: string
  created_at: Date
  updated_at: Date
}

export type sessionParams = {
  token: String
  user_agent: String
  client_ip: String
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
      ref: 'User',
      unique: true,
      required: true
    },
    token: {
      type: String,
      required: true
    },
    user_agent: String,
    client_ip: String,
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
