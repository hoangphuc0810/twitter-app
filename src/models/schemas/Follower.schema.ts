import { ObjectId } from 'mongodb'

export interface FollowerType {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
}

export default class Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date

  constructor(payload: FollowerType) {
    const { created_at, followed_user_id, user_id, _id } = payload
    this._id = _id
    this.user_id = user_id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || new Date()
  }
}
