import { MongoClient, Db, Collection } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'

dotenv.config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter-dev.5pxqk8u.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

class DatabaseService {
  private client: MongoClient
  private db: Db
  // private indexExists(nameAndDefinition: string[]) {
  //   return this.
  // }

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async indexUser() {
    const exist = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1'])
    if (!exist) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
    return exist
  }
  async indexVideoStatus() {
    const exist = await this.videoStatus.indexExists(['name_1'])
    if (!exist) {
      this.videoStatus.createIndex({ name: 1 }, { unique: true })
    }
    return exist
  }
  async indexRefreshToken() {
    const exist = await this.refreshToken.indexExists(['exp_1', 'token_1', 'user_id_1'])
    if (!exist) {
      this.refreshToken.createIndex({ user_id: 1 }, { unique: true })
      this.refreshToken.createIndex({ token: 1 }, { unique: true })
      this.refreshToken.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
    return exist
  }
  async indexFollower() {
    const exist = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!exist) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
    return exist
  }

  get users(): Collection<User> {
    return this.db.collection(`${process.env.DB_USERS_COLLECTION}`)
  }

  get refreshToken(): Collection<RefreshToken> {
    return this.db.collection(`${process.env.DB_REFRESH_TOKEN_COLLECTION}`)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(`${process.env.DB_FOLLOWERS_COLLECTION}`)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(`${process.env.DB_VIDEOSTATUS_COLLECTION}`)
  }
  
  get tweets(): Collection<Tweet> {
    return this.db.collection(`${process.env.DB_TWEETS_COLLECTION}`)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(`${process.env.DB_HASHTAGS_COLLECTION}`)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(`${process.env.DB_BOOKMARKS_COLLECTION}`)
  }
}

const databaseService = new DatabaseService()
export default databaseService
