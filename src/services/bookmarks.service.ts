import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.service'
import { BookmarkReqBody } from '~/models/requests/Bookmark.request'
import { Filter, FindOneAndUpdateOptions, ObjectId, UpdateFilter } from 'mongodb'

class BookmarkService {
  private findOneAndUpdateBookmark(
    filter: Filter<Bookmark>,
    update: UpdateFilter<Bookmark>,
    options: FindOneAndUpdateOptions
  ) {
    return databaseService.bookmarks.findOneAndUpdate(filter, update, options)
  }

  private deleteBookmarkTweet(filter: Filter<Bookmark>, options: FindOneAndUpdateOptions) {
    return databaseService.bookmarks.deleteOne(filter, options)
  }

  async bookmarkTweet(tweet_id: string, user_id: string) {
    const filter: Filter<Bookmark> = {
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id)
    }
    const update: UpdateFilter<Bookmark> = {
      $setOnInsert: new Bookmark({ tweet_id, user_id })
    }
    const options: FindOneAndUpdateOptions = {
      upsert: true,
      returnDocument: 'after'
    }

    return (await this.findOneAndUpdateBookmark(filter, update, options)).value
  }

  async unbookmarkTweet(tweet_id: string) {
    const filter: Filter<Bookmark> = {
      tweet_id: new ObjectId(tweet_id)
    }
    const options: FindOneAndUpdateOptions = {
      upsert: true,
      returnDocument: 'after'
    }

    return await this.deleteBookmarkTweet(filter, options)
  }
}

const bookmarkService = new BookmarkService()
export default bookmarkService
