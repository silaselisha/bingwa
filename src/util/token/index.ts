import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export interface Payload {
  email: string
  id: mongoose.Schema.Types.ObjectId
}

class AccessToken {
  createAccessToken = async (
    payload: Payload,
    duration: string
  ): Promise<string> => {
    const token: string = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: duration,
      algorithm: 'HS256'
    })

    return token
  }

  verifyAccessToken = async (token: string): Promise<jwt.JwtPayload> => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload
  }
}

export default AccessToken
