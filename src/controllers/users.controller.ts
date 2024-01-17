import e, { Response, Request, NextFunction } from 'express'
import usersService from '~/services/users.service'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  LogoutReqBody,
  ProfileReqParams,
  RefreshTokenPayload,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload,
  UnfollowReqParams,
  UpdateMyProfileReqBody,
  resetPasswordReqBody
} from '~/models/requests/User.requests'
import HTTP_STATUS from '~/constants/httpStatus'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGE } from '~/constants/message'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request, res: Response) => {
  const { user } = req
  const result = await usersService.login(user as User)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.LOGIN_SUCCESS,
    data: result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await usersService.register(req.body, UserVerifyStatus.Univerfied)
    res.status(HTTP_STATUS.CREATED).json({
      message: USERS_MESSAGE.REGISTER_SUCCESS,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body

  const { message } = await usersService.logout(refresh_token)

  res.status(HTTP_STATUS.OK).json({
    message
  })
}

export const emailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const { message, access_token, refresh_token } = await usersService.verifyEmail(user_id)
  res.status(HTTP_STATUS.OK).json({
    message,
    access_token,
    refresh_token
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { message } = await usersService.resendVerifyEmail(user_id)
  return res.status(HTTP_STATUS.OK).json({
    message
  })
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { _id, verify } = req.user as User
  const { message } = await usersService.forgotPassword((_id as ObjectId)?.toString(), verify)
  return res.status(HTTP_STATUS.OK).json({
    message
  })
}

export const verifyForgotPasswordControllter = async (req: Request, res: Response) => {
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.FORGOT_PASSWORD_TOKEN_VERIFY_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, resetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const { message } = await usersService.resetPassword(user_id, password)
  res.status(HTTP_STATUS.OK).json({
    message
  })
}

export const profileController = async (req: Request<ProfileReqParams>, res: Response) => {
  const { user_id } = req.params
  const result = await usersService.getProfile(user_id)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.GET_PROFILE_SUCCESS,
    data: result
  })
}

export const updateMyProfileController = async (
  req: Request<ParamsDictionary, any, UpdateMyProfileReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const payload = req.body
  const { ok, value } = await usersService.updateMyProfile(user_id, payload)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.UPDATE_PROFILE_SUCCESS,
    data: value,
    status: ok
  })
}

export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const { insertedId } = await usersService.follow(user_id, followed_user_id)

  res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGE.FOLLOW_SUCCESS,
    insertedId
  })
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const { deletedCount, acknowledged } = await usersService.unfollow(user_id, followed_user_id)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.UNFOLLOW_SUCCESS,
    deletedCount,
    acknowledged
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const { ok, value } = await usersService.changePassword(user_id, password)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGE.CHANGE_PASSWORD_SUCCESS,
    ok,
    value
  })
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const { access_token, refresh_token, newUser } = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}&new_user=${newUser}`

  return res.redirect(urlRedirect)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp, iat } = req.decoded_refresh_token as RefreshTokenPayload
  const refreshTokenPayload = {
    refresh_token,
    user_id,
    verify,
    exp,
    iat
  }

  const { message, newToken } = await usersService.refreshToken(refreshTokenPayload)
  res.status(HTTP_STATUS.OK).json({
    message,
    newToken
  })
}
