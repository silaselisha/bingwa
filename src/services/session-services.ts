import { type Request } from 'express'
import AccessToken, { type Payload } from '../util/token'
import { type SessionModel, type sessionParams } from '../models/session-model'

class SessionServices {
  constructor(
    private readonly _sessionModel: SessionModel,
    private readonly _accessToken: AccessToken
  ) {}

  async generateRefreshToken(req: Request, payload: Payload): Promise<String> {
    const token = await this._accessToken.createAccessToken(
      payload,
      process.env.JWT_RFT_EXPIRES_IN as string
    )

    const sessionData: sessionParams = {
      token,
      user_agent: req.get('User-Agent') as string,
      client_ip: req.ip as string,
      isExpired: false,
      user: payload.id
    }

    this._sessionModel.create(sessionData)
    return token
  }
}

export default SessionServices
