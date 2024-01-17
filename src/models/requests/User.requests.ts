import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ParamsDictionary } from 'express-serve-static-core'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface RefreshTokenPayload extends JwtPayload {
  user_id: string
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface resetPasswordReqBody {
  password: string
  confrimPassword: string
  forgot_password_token: string
}

export interface UpdateMyProfileReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface FollowReqBody {
  followed_user_id: string
}

export interface ProfileReqParams extends ParamsDictionary {
  user_id: string
}

export interface UnfollowReqParams extends ParamsDictionary {
  user_id: string
}

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confrim_password: string
}
