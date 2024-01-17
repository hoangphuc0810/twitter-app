import { ObjectId } from 'mongodb'

export interface RefreshTokenType {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at?: Date
  iat: number
  exp: number
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at: Date
  iat: Date
  exp: Date

  constructor(payload: RefreshTokenType) {
    const { created_at, token, user_id, _id, exp, iat } = payload
    this._id = _id
    this.created_at = created_at || new Date()
    this.token = token
    this.user_id = user_id
    this.iat = new Date(iat * 1000)
    this.exp = new Date(exp * 1000)
  }
}
