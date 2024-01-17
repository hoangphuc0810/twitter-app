import { ObjectId } from 'mongodb'
import { TweetAudiance, TweetType } from '~/constants/enums'
import { Media } from '../Orther'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface TweetReqBody {
  type: TweetType
  audience: TweetAudiance
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export interface TweetChildReq {
  tweet_id: string
  tweet_type: TweetType
  page: number
  limit: number
  user_id: string
}

export interface TweetParams extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Query {
  page: string
  limit: string
  tweet_type: string
}
