import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  loginController,
  logoutController,
  oauthController,
  profileController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMyProfileController,
  verifyForgotPasswordControllter
} from '~/controllers/users.controller'
import { filterKeyMiddleware } from '~/middlewares/common.middleware'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateProfileValidator,
  verifiedUserValidator,
  verifyForgotPasswordToken
} from '~/middlewares/users.middlewares'
import { UpdateMyProfileReqBody } from '~/models/requests/User.requests'
import { wrapResquestHandler } from '~/utils/handler'

const usersRouter = Router()
// GET
usersRouter.get('/profile/:user_id', accessTokenValidator, wrapResquestHandler(profileController))
usersRouter.get('/oauth/google', wrapResquestHandler(oauthController))

// POST
usersRouter.post('/login', loginValidator, wrapResquestHandler(loginController))
usersRouter.post('/register', registerValidator, wrapResquestHandler(registerController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapResquestHandler(logoutController))
usersRouter.post('/verify-email', emailVerifyValidator, wrapResquestHandler(emailVerifyController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapResquestHandler(resendEmailVerifyController))
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapResquestHandler(forgotPasswordController))
usersRouter.post(
  '/verify-forgot-password-token',
  verifyForgotPasswordToken,
  wrapResquestHandler(verifyForgotPasswordControllter)
)
usersRouter.post('/reset-password', resetPasswordValidator, wrapResquestHandler(resetPasswordController))
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapResquestHandler(followController)
)
usersRouter.post('/refresh-token', refreshTokenValidator, wrapResquestHandler(refreshTokenController))
// PUT
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapResquestHandler(changePasswordController)
)

// PATCH
usersRouter.patch(
  '/update-my-profile',
  accessTokenValidator,
  verifiedUserValidator,
  updateProfileValidator,
  filterKeyMiddleware<UpdateMyProfileReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapResquestHandler(updateMyProfileController)
)

// DELETE
usersRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapResquestHandler(unfollowController)
)
export default usersRouter
