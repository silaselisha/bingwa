import { type Request } from 'express'
import mongoose from 'mongoose'
import AccessToken, { type Payload } from '../util/token'
import {
  type SessionModel,
  type sessionParams,
  type ISession
} from '../models/session-model'

class SessionServices {
  constructor(
    private readonly _sessionModel: SessionModel,
    private readonly _accessToken: AccessToken
  ) {}

  async generateRefreshToken(
    req: Request,
    payload: Payload
  ): Promise<ISession> {
    const token = await this._accessToken.createAccessToken(
      payload,
      process.env.JWT_RFT_EXPIRES_IN as string
    )

    const sessionData: sessionParams = {
      token,
      user_agent: req.get('User-Agent') as string,
      client_ip: req.ip as string,
      user: payload.id
    }

    const session = await this._sessionModel.create(sessionData)
    return session
  }

  async fetchRefreshToken(
    userId: mongoose.Schema.Types.ObjectId
  ): Promise<ISession> {
    const session = (await this._sessionModel
      .findOne({ user: userId })
      .populate({ path: 'user' })
      .exec()) as ISession

    return session
  }
}

export default SessionServices
