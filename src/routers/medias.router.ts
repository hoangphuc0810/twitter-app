import { Router } from 'express'
import {
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController,
  videoStatusController
} from '~/controllers/medias.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapResquestHandler } from '~/utils/handler'

const mediasRouter = Router()

// POST
mediasRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapResquestHandler(uploadImageController)
)
mediasRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapResquestHandler(uploadVideoController)
)
mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifiedUserValidator,
  wrapResquestHandler(uploadVideoHLSController)
)

// GET
mediasRouter.get(
  '/video-status/:id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapResquestHandler(videoStatusController)
)

export default mediasRouter
