import { Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { BOOKMARK_MESSAGE } from '~/constants/message'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkService from '~/services/bookmarks.service'

export const bookmarkTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const data = await bookmarkService.bookmarkTweet(tweet_id, user_id)

  return res.status(HTTP_STATUS.CREATED).json({
    message: `bookmark tweet ${BOOKMARK_MESSAGE.CREATED_SUCCESS}`,
    data
  })
}

export const unbookmarkController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const data = await bookmarkService.unbookmarkTweet(tweet_id)

  return res.status(HTTP_STATUS.CREATED).json({
    message: `bookmark tweet ${BOOKMARK_MESSAGE.DELETE_SUCCESS}`,
    data
  })
}
