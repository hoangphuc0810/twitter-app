import { config } from 'dotenv'
import jwt, { SignOptions } from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'

config()

interface signTokenObj {
  payload: string | Buffer | object
  secretKey: string
  options?: SignOptions
}

export interface VerifyTokenType {
  token: string
  secretKey: string
}

export const signToken = ({ payload, secretKey, options = { algorithm: 'HS256' } }: signTokenObj) => {
  return new Promise<string>((resolve, rejects) => {
    jwt.sign(payload, secretKey, options, (error, token) => {
      if (error) {
        rejects(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = (payload: VerifyTokenType) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    const { token, secretKey } = payload
    jwt.verify(token, secretKey, (error, decode) => {
      if (error) throw reject(error)
      resolve(decode as TokenPayload)
    })
  })
}
