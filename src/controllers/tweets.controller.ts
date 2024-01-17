import { Request, Response } from 'express'
import tweetService from '~/services/tweets.service'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetParams, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.request'
import HTTP_STATUS from '~/constants/httpStatus'
import { TokenPayload } from '~/models/requests/User.requests'
import { TWEET_MESSAGE } from '~/constants/message'
import Tweet from '~/models/schemas/Tweet.schema'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const data = await tweetService.createTweet(req.body, user_id)
  return res.status(HTTP_STATUS.CREATED).json({
    message: TWEET_MESSAGE.CREATED_SUCCESS,
    data
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const user_id = req.decoded_authorization?.user_id
  const { guest_views, user_views } = await tweetService.increaseview(tweet_id, user_id)
  const data = {
    ...req.tweet,
    guest_views,
    user_views
  }
  res.status(HTTP_STATUS.OK).json({
    message: 'get tweet success',
    data
  })
}

export const getTweetChildrenController = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params
  const { limit, page, tweet_type } = req.query
  const { user_id } = req.decoded_authorization as TokenPayload
  const payload = {
    tweet_id,
    limit: Number(limit),
    page: Number(page),
    tweet_type: Number(tweet_type),
    user_id
  }
  const { total, tweets } = await tweetService.getTweetChild(payload)

  res.status(HTTP_STATUS.OK).json({
    message: 'get tweet success',
    total_page: Math.ceil(total / payload.limit),
    limit,
    page,
    tweet_type,
    tweets
  })
}

export const getNewFeedController = async (req: Request<ParamsDictionary, any, any, TweetQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id as string
  const result = await tweetService.getNewFeed({ limit, page, user_id })

  res.status(HTTP_STATUS.OK).json({
    message: 'get new feed success',
    result
  })
}
