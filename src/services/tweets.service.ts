import { TweetChildReq, TweetReqBody } from '~/models/requests/Tweet.request'
import databaseService from './database.service'
import Tweet from '~/models/schemas/Tweet.schema'
import { Filter, FindOneAndUpdateOptions, ObjectId, UpdateFilter, UpdateOptions, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { newBodyType } from '~/models/Orther'
import { TweetType } from '~/constants/enums'

class TweetService {
  private insertTweet(tweet: newBodyType) {
    return databaseService.tweets.insertOne(new Tweet(tweet))
  }

  private findOneAndUpdateTweet(filter: Filter<Tweet>, update: UpdateFilter<Tweet>, options: FindOneAndUpdateOptions) {
    return databaseService.tweets.findOneAndUpdate(filter, update, options)
  }

  private findOneAndUpdateHashtag(
    filter: Filter<Hashtag>,
    update: UpdateFilter<Hashtag>,
    options: FindOneAndUpdateOptions
  ) {
    return databaseService.hashtags.findOneAndUpdate(filter, update, options)
  }

  private updateManyTweet(filter: Filter<Tweet>, update: UpdateFilter<Tweet>, options: UpdateOptions) {
    return databaseService.tweets.updateMany(filter, update, options)
  }

  private async hashTagExist(hashtags: string[]) {
    const result = await Promise.all(
      hashtags.map((item) => {
        const filter: Filter<Hashtag> = {
          name: item
        }
        const update: UpdateFilter<Hashtag> = {
          $setOnInsert: new Hashtag({ name: item })
        }
        const options: FindOneAndUpdateOptions = {
          upsert: true,
          returnDocument: 'after'
        }
        return this.findOneAndUpdateHashtag(filter, update, options)
      })
    )
    return result.map((item) => (item.value as WithId<Hashtag>)._id)
  }

  async createTweet(body: TweetReqBody, user_id: string) {
    const hashtags = await this.hashTagExist(body.hashtags)
    const newBody = {
      ...body,
      hashtags,
      user_id
    }
    const result = await this.insertTweet(newBody)
    return result
  }

  async increaseview(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const filter: Filter<Tweet> = {
      _id: new ObjectId(tweet_id)
    }
    const update: UpdateFilter<Tweet> = {
      $inc: inc,
      $currentDate: {
        updated_at: true
      }
    }
    const options: FindOneAndUpdateOptions = {
      returnDocument: 'after',
      projection: {
        guest_views: 1,
        user_views: 1
      }
    }
    const result = await this.findOneAndUpdateTweet(filter, update, options)
    return result.value as WithId<{
      guest_views: number
      user_views: number
    }>
  }

  async getTweetChild({ tweet_id, limit, page, tweet_type, user_id }: TweetChildReq) {
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate<Tweet>([
          {
            $match: {
              parent_id: new ObjectId(tweet_id),
              type: tweet_type
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
              }
            }
          },
          {
            $project: {
              tweets_children: 0
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])

    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const filter: Filter<Tweet> = {
      _id: {
        $in: ids
      }
    }
    const update: UpdateFilter<Tweet> = {
      $inc: inc,
      $set: {
        updated_at: new Date()
      }
    }
    const options: UpdateOptions = {}
    this.updateManyTweet(filter, update, options)

    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return { tweets, total }
  }

  async getNewFeed({ page, limit, user_id }: { page: number; limit: number; user_id: string }) {
    const followed_user_ids = await databaseService.followers
      .find(
        { user_id: new ObjectId(user_id) },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(new ObjectId(user_id))
    return ids
  }
}

const tweetService = new TweetService()
export default tweetService
