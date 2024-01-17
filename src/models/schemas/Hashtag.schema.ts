import { ObjectId } from 'mongodb'

interface HashtagConstructor {
  _id?: ObjectId
  name: string
  create_at?: Date
}

export default class Hashtag {
  _id?: ObjectId
  name: string
  create_at: Date

  constructor({ create_at, name, _id }: HashtagConstructor) {
    const now = new Date()
    this._id = _id || new ObjectId()
    this.name = name
    this.create_at = create_at || now
  }
}
