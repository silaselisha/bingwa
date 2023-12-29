import jwt from 'jsonwebtoken'
export interface Payload {
  email: string
}

class AccessToken {
  createAccessToken = async (payload: Payload): Promise<string> => {
    const token: string = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN,
      algorithm: 'HS256'
    })

    return token
  }

  verifyAccessToken = async (token: string): Promise<jwt.JwtPayload> => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload
  }
}

export default AccessToken
