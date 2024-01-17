import { ObjectId } from 'mongodb'

interface BookmarkConstructor {
  _id?: ObjectId
  user_id: string
  tweet_id: string
  create_at?: Date
}

export default class Bookmark {
  _id: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  create_at: Date
  constructor({ tweet_id, user_id, _id, create_at }: BookmarkConstructor) {
    const now = new Date()
    this._id = _id || new ObjectId()
    this.user_id = new ObjectId(user_id)
    this.tweet_id = new ObjectId(tweet_id)
    this.create_at = create_at || now
  }
}
