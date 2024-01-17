import { check, checkSchema } from 'express-validator'
import { MeidaType, TweetAudiance, TweetType, UserVerifyStatus } from '~/constants/enums'
import { TWEET_MESSAGE, USERS_MESSAGE } from '~/constants/message'
import { numberEnumToArray } from '~/utils/common,'
import { validate } from '~/utils/validation'
import { isEmpty, every } from 'lodash'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.service'
import { NextFunction, Request, Response } from 'express'
import Tweet from '~/models/schemas/Tweet.schema'
import usersService from '~/services/users.service'
import { TokenPayload } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { wrapResquestHandler } from '~/utils/handler'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudiance)
const mediasType = numberEnumToArray(MeidaType)

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: `type ${TWEET_MESSAGE.INVALID}`
      }
    },
    audience: {
      isIn: {
        options: [tweetAudiences],
        errorMessage: `audience ${TWEET_MESSAGE.INVALID}`
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type
          // nếu 'type' là retweet,comment,quotetweet thì 'parent_id' phải là tweet_id của thằng cha
          const { Comment, QuoteTweet, Retweet, Tweet } = TweetType
          const checkTweetType = ![Comment, QuoteTweet, Retweet, , Tweet].includes(type) && !ObjectId.isValid(value)
          if (checkTweetType) {
            throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }
          if (type === Tweet && value !== null) {
            throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const { type, mentions, hastags }: { type: TweetType; mentions: string[]; hastags: string[] } = req.body
          // nếu 'type' là 'comment,quotetweet,tweet' và không có [mention,hastags] thì 'content' phải là string và không được rỗng
          const { Comment, QuoteTweet, Retweet, Tweet } = TweetType
          const checkTweetType =
            [Comment, QuoteTweet, Tweet].includes(type) && isEmpty(mentions) && isEmpty(hastags) && value === ''
          if (checkTweetType) {
            throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          // nếu 'type' là 'retweet' thì 'content' phải là `''`
          if (type === Retweet && value !== '') {
            throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          const valueIsString = value.some((item: any) => typeof item !== 'string')
          if (valueIsString) {
            throw new Error(TWEET_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // yêu cầu mỗĩ phần tử trong array là user_id
          const valueIsString = value.some((item: any) => !ObjectId.isValid(item))
          if (valueIsString) {
            throw new Error(TWEET_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // yêu cầu mỗĩ phần tử trong array là media obj
          const valueIsString = value.some((item: any) => {
            return typeof item.url !== 'string' || !mediasType.includes(item.typpe)
          })
          if (valueIsString) {
            throw new Error(TWEET_MESSAGE.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJ)
          }
          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema({
    tweet_id: {
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({ message: `tweet_id ${TWEET_MESSAGE.INVALID}`, status: HTTP_STATUS.BAD_REQUEST })
          }
          const [tweetExist] = await databaseService.tweets
            .aggregate<Tweet>([
              {
                $match: {
                  _id: new ObjectId(value)
                }
              },
              {
                $lookup: {
                  from: 'hashtags',
                  localField: 'hashtags',
                  foreignField: '_id',
                  as: 'hashtags'
                }
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'mentions',
                  foreignField: '_id',
                  as: 'mentions'
                }
              },
              {
                $addFields: {
                  mentions: {
                    $map: {
                      input: '$mentions',
                      as: 'mention',
                      in: {
                        _id: '$$mention._id',
                        name: '$$mention.name'
                      }
                    }
                  }
                }
              },
              {
                $lookup: {
                  from: 'tweets',
                  localField: '_id',
                  foreignField: 'parent_id',
                  as: 'tweets_children'
                }
              },
              {
                $addFields: {
                  hashtags: {
                    $cond: {
                      if: {
                        $isArray: '$hashtags'
                      },
                      then: {
                        $size: '$hashtags'
                      },
                      else: 'NA'
                    }
                  },
                  retweet_count: {
                    $size: {
                      $filter: {
                        input: '$tweets_children',
                        as: 'item',
                        cond: {
                          $eq: ['$$item.type', TweetType.Retweet]
                        }
                      }
                    }
                  },
                  comment_count: {
                    $size: {
                      $filter: {
                        input: '$tweets_children',
                        as: 'item',
                        cond: {
                          $eq: ['$$item.type', TweetType.Comment]
                        }
                      }
                    }
                  },
                  quote_count: {
                    $size: {
                      $filter: {
                        input: '$tweets_children',
                        as: 'item',
                        cond: {
                          $eq: ['$$item.type', TweetType.QuoteTweet]
                        }
                      }
                    }
                  },
                  views: {
                    $add: ['$guest_views', '$user_views']
                  }
                }
              },
              {
                $project: {
                  tweets_children: 0
                }
              }
            ])
            .toArray()
          if (!tweetExist) {
            throw new ErrorWithStatus({ message: `tweet_id ${TWEET_MESSAGE.NOT_FOUND}`, status: HTTP_STATUS.NOT_FOUND })
          }
          req.tweet = tweetExist
          return true
        }
      }
    }
  })
)

export const tweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isNumeric: true,
        isIn: {
          options: [TweetType],
          errorMessage: `tweet_type ${TWEET_MESSAGE.INVALID}`
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema({
    limit: {
      isNumeric: true,
      custom: {
        options: (value) => {
          const limit = Number(value)
          if (limit >= 100 && limit < 1) {
            throw new Error('1 <= limit <= 100')
          }
          return true
        }
      }
    },
    page: {
      isNumeric: true,
      custom: {
        options: (value) => {
          const page = Number(value)
          if (page < 1) {
            throw new Error('page >= 1')
          }
          return true
        }
      }
    }
  })
)

export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}
export const audienceValidator = wrapResquestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet

  // kiểm tra người dùng đã đăng nhập hay chưa
  const decoded_authorization = req.decoded_authorization as TokenPayload
  if (tweet.audience !== TweetAudiance.TwitterCircle) {
    return next()
  }

  if (!req.decoded_authorization) {
    throw new ErrorWithStatus({ message: USERS_MESSAGE.AUTHORIZATION, status: HTTP_STATUS.UNAUTHORIZED })
  }
  // kiểm tra trạng thái tài khoản của tác giả (còn hoạt động hay đã bị khóa)
  const author = (await usersService.findUser({ _id: tweet.user_id }, {})) as User

  if (!author || author.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: `${USERS_MESSAGE.NOT_FOUND} or ${USERS_MESSAGE.USER_HAVE_BEEN_BANNED}`,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  // kiểm tra user_id có nằm trong tweet_circle hoặc mình có phải chủ bài viết hay không
  const isInTwitterCircle = author.twitter_circle.some((user_circle_id) =>
    user_circle_id.equals(decoded_authorization.user_id)
  )

  if (!author._id?.equals(decoded_authorization.user_id) && !isInTwitterCircle) {
    throw new ErrorWithStatus({
      message: TWEET_MESSAGE.YOU_ARE_NOT_AUTHOR_OR_YOU_ARE_NOT_ON_THE_LIST,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  next()
})
