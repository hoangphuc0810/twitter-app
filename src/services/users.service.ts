import User from '~/models/schemas/User.schema'
import databaseService from './database.service'
import {
  LoginReqBody,
  RefreshTokenPayload,
  RegisterReqBody,
  UpdateMyProfileReqBody
} from '~/models/requests/User.requests'
import { VerifyTokenType, signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { hashPassword } from '~/utils/crypto'
import refreshToken, { RefreshTokenType } from '~/models/schemas/RefreshToken.schema'
import { Collection, Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter, WithId } from 'mongodb'
import { config } from 'dotenv'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGE } from '~/constants/message'
import HTTP_STATUS from '~/constants/httpStatus'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower, { FollowerType } from '~/models/schemas/Follower.schema'
import axios from 'axios'
import { header } from 'express-validator'

config()

class UsersService {
  private signAccessToken(user_id: string, verify: UserVerifyStatus) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      secretKey: process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken(user_id: string, verify: UserVerifyStatus, exp?: number) {
    if (!exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify
        },
        secretKey: process.env.JWT_REFRESH_TOOKEN_SECRET_KEY as string,
        options: {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
        }
      })
    }

    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
        exp
      },
      secretKey: process.env.JWT_REFRESH_TOOKEN_SECRET_KEY as string
    })
  }

  private signEmailVerifyToken(user_id: string, verify: UserVerifyStatus) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      secretKey: process.env.JWT_EMAIL_VERIFY_TOOKEN_SECRET_KEY as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken(user_id: string, verify: UserVerifyStatus) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      secretKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRET_KEY as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    const payload: VerifyTokenType = {
      token: refresh_token,
      secretKey: process.env.JWT_REFRESH_TOOKEN_SECRET_KEY as string
    }
    return verifyToken(payload)
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post(process.env.GET_GOOGLE_TOKEN_URI as string, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get(process.env.GET_USER_INFO_URI as string, {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      email_verified: boolean
      name: string
      picture: string
    }
  }

  // --------------- fearture --------------------

  async register(payload: RegisterReqBody, verify: UserVerifyStatus) {
    const user_id = new ObjectId()
    const email_verify_token =
      verify === UserVerifyStatus.Verified ? '' : await this.signEmailVerifyToken(user_id.toString(), verify)
    const { insertedId } = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: await hashPassword(payload.password),
        email_verify_token,
        verify,
        username: payload.email.split('@')[0]
      })
    )
    return await this.createNewToken(insertedId.toString(), verify)
  }

  async login(user: User) {
    const { verify } = user
    if (verify === UserVerifyStatus.Univerfied) {
      throw new ErrorWithStatus({ message: USERS_MESSAGE.EMAIL_UNVERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }

    const user_id = user?._id?.toString()
    const refresh_token = await this.findRefreshTokenByUserId(user_id as string)
    if (refresh_token && refresh_token.token) {
      await this.deleteRefreshToken(refresh_token.token)
    }
    return await this.createNewToken(user_id as string, verify)
  }

  async logout(refresh_token: string) {
    const deletedRefreshToken = await this.deleteRefreshToken(refresh_token)

    if (deletedRefreshToken.deletedCount === 0) {
      throw new ErrorWithStatus({ message: 'can not found refresh token to delete', status: HTTP_STATUS.NOT_FOUND })
    }
    return { message: 'logout success' }
  }

  async verifyEmail(user_id: string) {
    const verify = UserVerifyStatus.Verified
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }
    const payload: UpdateFilter<User> = {
      $set: {
        email_verify_token: '',
        verify
      },
      $currentDate: {
        updated_at: true
      }
    }
    const options = {}
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id, verify),
      this.signRefreshToken(user_id, verify),
      this.updateUser(filter, payload, options)
    ])
    const decodeRefreshToken = await this.decodeRefreshToken(refresh_token)
    const filterRefreshToken: Filter<refreshToken> = {
      user_id: new ObjectId(user_id)
    }
    const updateRefreshToken: UpdateFilter<refreshToken> = {
      $set: {
        token: refresh_token,
        iat: new Date((decodeRefreshToken.iat as number) * 1000),
        exp: new Date((decodeRefreshToken.exp as number) * 1000)
      }
    }
    const optionsRefreshToken: FindOneAndUpdateOptions = {
      returnDocument: 'after'
    }
    await this.updateRefreshToken(filterRefreshToken, updateRefreshToken, optionsRefreshToken)

    return {
      message: USERS_MESSAGE.EMAIL_VERIFY_SUCCESS,
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const options = {}
    const payload = {
      _id: new ObjectId(user_id)
    }
    const user = (await this.findUser(payload, options)) as User
    if (!user) {
      throw new ErrorWithStatus({ message: USERS_MESSAGE.NOT_FOUND, status: HTTP_STATUS.BAD_REQUEST })
    }
    if (user.verify === UserVerifyStatus.Verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const email_verify_token = await this.signEmailVerifyToken(user_id, UserVerifyStatus.Univerfied)
    const payloadToUpdate: UpdateFilter<Collection> = {
      $set: {
        email_verify_token
      },
      $currentDate: {
        updated_at: true
      }
    }
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }

    await this.updateUser(filter, payloadToUpdate, options)

    return {
      message: 'Resend email verify token success'
    }
  }

  async forgotPassword(user_id: string, verify: UserVerifyStatus) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id, verify)
    const options = {}
    const payload: UpdateFilter<Collection> = {
      $set: {
        forgot_password_token
      },
      $currentDate: {
        updated_at: true
      }
    }
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }
    await this.updateUser(filter, payload, options)
    return {
      message: USERS_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    const options = {}
    const payload: UpdateFilter<Collection> = {
      $set: {
        password: await hashPassword(password),
        forgot_password_token: ''
      },
      $currentDate: {
        updated_at: true
      }
    }
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }
    await this.updateUser(filter, payload, options)
    return {
      message: USERS_MESSAGE.PASSWORD_RESET_SUCCESS
    }
  }

  getProfile(user_id: string) {
    const payload = {
      _id: new ObjectId(user_id)
    }
    const options: FindOptions = {
      projection: {
        password: 0,
        forgot_password_token: 0,
        email_verify_token: 0
      }
    }
    return this.findUser(payload, options)
  }

  updateMyProfile(user_id: string, payload: UpdateMyProfileReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const options: FindOneAndUpdateOptions = {
      projection: {
        password: 0,
        forgot_password_token: 0,
        email_verify_token: 0
      },
      returnDocument: 'after'
    }
    const payloadToUpdate: UpdateFilter<Collection> = {
      $set: _payload,
      $currentDate: {
        updated_at: true
      }
    }
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }
    return this.updateUser(filter, payloadToUpdate, options)
  }

  async follow(user_id: string, followed_user_id: string) {
    const follow_exist = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follow_exist) {
      throw new ErrorWithStatus({ message: USERS_MESSAGE.FOLLOWED, status: HTTP_STATUS.BAD_REQUEST })
    }

    const payload: FollowerType = { user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) }

    return this.insertFollower(payload)
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follow_exist = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follow_exist) {
      throw new ErrorWithStatus({ message: USERS_MESSAGE.HAVE_BEEN_UNFOLLOWED, status: HTTP_STATUS.BAD_REQUEST })
    }

    const payload: FollowerType = {
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    }

    return await this.deleteFollower(payload)
  }

  async changePassword(user_id: string, password: string) {
    const filter: Filter<User> = {
      _id: new ObjectId(user_id)
    }
    const payloadToUpdate: UpdateFilter<Collection> = {
      $set: {
        password: await hashPassword(password)
      },
      $currentDate: {
        updated_at: true
      }
    }
    const options: FindOneAndUpdateOptions = {
      projection: {
        email_verify_token: 0,
        forgot_password_token: 0,
        password: 0
      },
      returnDocument: 'after'
    }
    return this.updateUser(filter, payloadToUpdate, options)
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    // userinfo từ gg trả về
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    if (!userInfo.email_verified) {
      throw new ErrorWithStatus({ message: USERS_MESSAGE.EMAIL_UNVERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }

    // user trong db
    const user = (await this.findUser({ email: userInfo.email }, {})) as User

    if (!user) {
      const randomPassword = Math.random().toString(36).substring(2, 7)
      const payload: RegisterReqBody = {
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password: randomPassword,
        confirm_password: randomPassword
      }
      const data = await this.register(payload, UserVerifyStatus.Verified)

      return { ...data, newUser: true }
    }

    const _id = user._id?.toString()
    const newToken = await this.createNewToken(_id as string, user.verify)

    return {
      access_token: newToken.access_token,
      refresh_token: newToken.refresh_token,
      newUser: false
    }
  }

  async refreshToken(refreshTokenPayload: RefreshTokenPayload) {
    const { refresh_token, user_id, verify, exp } = refreshTokenPayload
    const [newToken] = await Promise.all([
      this.createNewToken(user_id, verify, exp),
      this.deleteRefreshToken(refresh_token)
    ])
    return {
      message: USERS_MESSAGE.REFRESH_TOKEN_SUCCESS,
      newToken
    }
  }
  // ----------------- utils ----------------------

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async checkEmailVerifyTokenExist(email_verify_token: string) {
    const result = await databaseService.users.findOne({ email_verify_token })
    return Boolean(result)
  }

  // --------- find ----------
  async findUser(filter: Filter<User>, options: FindOptions) {
    return await databaseService.users.findOne(filter, options)
  }

  async findRefreshTokenByUserId(user_id: string) {
    return await databaseService.refreshToken.findOne({ user_id: new ObjectId(user_id) })
  }

  // -------------------create------------------

  async createNewToken(user_id: string, verify: UserVerifyStatus, exp?: number) {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id, verify),
      this.signRefreshToken(user_id, verify, exp)
    ])
    const decodeRefreshToken = await this.decodeRefreshToken(refresh_token)
    const payloadRefreshToken = {
      user_id: new ObjectId(user_id),
      token: refresh_token as string,
      iat: decodeRefreshToken.iat as number,
      exp: decodeRefreshToken.exp as number
    }
    await databaseService.refreshToken.insertOne(new refreshToken(payloadRefreshToken))
    return {
      access_token,
      refresh_token
    }
  }

  async insertFollower(payload: FollowerType) {
    return databaseService.followers.insertOne(new Follower(payload))
  }

  //-------------- update-----------------------
  async updateUser(filter: Filter<User>, payload: UpdateFilter<Collection>, options: FindOneAndUpdateOptions) {
    return await databaseService.users.findOneAndUpdate(filter, payload, options)
  }

  async updateRefreshToken(
    filter: Filter<RefreshToken>,
    payload: UpdateFilter<RefreshToken>,
    options: FindOneAndUpdateOptions
  ) {
    return await databaseService.refreshToken.findOneAndUpdate(filter, payload, options)
  }
  // -------------- delete ------------------------
  async deleteRefreshToken(refresh_token: string) {
    return await databaseService.refreshToken.deleteOne({ token: refresh_token })
  }

  async deleteFollower(payload: FollowerType) {
    return await databaseService.followers.deleteOne(payload)
  }
}

const usersService = new UsersService()
export default usersService
