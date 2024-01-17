import { Router } from 'express'
import { bookmarkTweetController, unbookmarkController } from '~/controllers/bookmarks.controller'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapResquestHandler } from '~/utils/handler'

const bookMarkRouter = Router()

bookMarkRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapResquestHandler(bookmarkTweetController)
)
bookMarkRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapResquestHandler(unbookmarkController)
)

export default bookMarkRouter
