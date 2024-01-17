import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  twitter_circle?: ObjectId[]
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  twitter_circle: ObjectId[]
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.avatar = user.avatar || ''
    this.bio = user.bio || ''
    this.cover_photo = user.cover_photo || ''
    this.created_at = user.created_at || date
    this.date_of_birth = user.date_of_birth || date
    this.email = user.email
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.location = user.location || ''
    this.name = user.name || ''
    this.password = user.password
    this.updated_at = user.updated_at || date
    this.username = user.username || ''
    this.website = user.website || ''
    this.verify = user.verify || UserVerifyStatus.Univerfied
    this.twitter_circle = user.twitter_circle || []
  }
}
