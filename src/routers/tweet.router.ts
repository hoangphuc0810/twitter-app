import { Router } from 'express'
import { createTweetController, getNewFeedController, getTweetChildrenController, getTweetController } from '~/controllers/tweets.controller'
import { audienceValidator, createTweetValidator, isUserLoggedInValidator, paginationValidator, tweetChildrenValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapResquestHandler } from '~/utils/handler'

const tweetsRouter = Router()

// GET
tweetsRouter.get(
  '/new-feed',
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapResquestHandler(getNewFeedController)
)

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapResquestHandler(getTweetController)
)

tweetsRouter.get(
  '/:tweet_id/child',
  tweetIdValidator,
  tweetChildrenValidator,
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapResquestHandler(getTweetChildrenController)
)

// POST
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapResquestHandler(createTweetController)
)

export default tweetsRouter
