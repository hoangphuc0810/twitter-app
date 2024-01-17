import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { EncodingStatus, MeidaType } from '~/constants/enums'
import { Media } from '~/models/Orther'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir.'
import fsPromise from 'fs/promises'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.service'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

class Queue {
  items: string[]
  encoding: boolean

  private async insertVideoStatus(idName: string) {
    return await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
  }
  private async updateVideoStatus(idName: string, status: EncodingStatus) {
    return await databaseService.videoStatus.updateOne(
      { name: idName },
      {
        $set: {
          status
        },
        $currentDate: {
          update_at: true
        }
      }
    )
  }

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullName(item.split('\\').pop() as string)
    await this.insertVideoStatus(idName)
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.items.length === 0) {
      return console.log('Encode video queue is empty')
    }
    const videoPath = this.items[0]
    const idName = getNameFromFullName(videoPath.split('\\').pop() as string)
    try {
      this.encoding = true
      await this.updateVideoStatus(idName, EncodingStatus.Processing) // update status thành proccessing (đang xử lý)
      await encodeHLSWithMultipleVideoStreams(videoPath)
      this.items.shift()
      await fsPromise.unlink(videoPath)
      await this.updateVideoStatus(idName, EncodingStatus.Success) // update status thành success
      this.encoding = false
      console.log(`Encode video ${videoPath} success`)
    } catch (error) {
      console.log(error)
      await this.updateVideoStatus(idName, EncodingStatus.Failed).catch((error) => {
        console.log('lỗi do sever', error)
      })
    }
    this.processEncode()
  }
}

const queue = new Queue()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath) //giảm dung lượng ảnh
        fs.unlinkSync(file.filepath)

        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MeidaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)

    const result: Media[] = files.map((file) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/video-stream/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video-stream/${file.newFilename}`,
        type: MeidaType.Video
      }
    })

    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        queue.enqueue(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${newName}/master.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newName}/master.m3u8`,
          type: MeidaType.HLS
        }
      })
    )

    return result
  }

  async getVideoStatus(idName: string) {
    return await databaseService.videoStatus.findOne({ name: idName })
  }
}

const mediasService = new MediasService()

export default mediasService
