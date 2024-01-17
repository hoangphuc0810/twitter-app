import { ObjectId } from 'mongodb'
import { TweetAudiance, TweetType } from '~/constants/enums'
import { Media } from '../Orther'

interface TweetConstructor {
  _id?: ObjectId
  user_id: string
  type: TweetType
  audience: TweetAudiance
  content: string
  parent_id: null | string
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudiance
  content: string
  parent_id: null | ObjectId
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at?: Date
  updated_at?: Date

  constructor({
    audience,
    content,
    guest_views,
    hashtags,
    medias,
    mentions,
    parent_id,
    type,
    user_id,
    user_views,
    _id,
    created_at,
    updated_at
  }: TweetConstructor) {
    const now = new Date()
    this._id = _id
    this.audience = audience
    this.content = content || ''
    this.hashtags = hashtags.map((item) => new ObjectId(item))
    this.medias = medias
    this.mentions = mentions.map((item) => new ObjectId(item))
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.type = type
    this.user_id = new ObjectId(user_id)
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.created_at = created_at || now
    this.updated_at = updated_at || now
  }
}
