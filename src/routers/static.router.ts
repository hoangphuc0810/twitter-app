import { Router } from 'express'
import { serveImageController, serveM3u8Controller, serveSegmentController, serveVideoStreamController } from '~/controllers/medias.controller'
import { wrapResquestHandler } from '~/utils/handler'

const staticRouter = Router()

// GET
staticRouter.get('/image/:name', wrapResquestHandler(serveImageController))
staticRouter.get('/video-stream/:name', wrapResquestHandler(serveVideoStreamController))
staticRouter.get('/video-hls/:id/master.m3u8', wrapResquestHandler(serveM3u8Controller))
staticRouter.get('/video-hls/:id/:v/:segment', wrapResquestHandler(serveSegmentController))

export default staticRouter
