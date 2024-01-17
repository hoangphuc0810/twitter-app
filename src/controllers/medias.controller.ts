import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir.'
import HTTP_STATUS from '~/constants/httpStatus'
import mediasService from '~/services/medias.service'
import fs from 'fs'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadImage(req)

  res.json({
    data: url
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadVideo(req)

  res.json({
    data: url
  })
}

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadVideoHLS(req)

  res.json({
    data: url
  })
}

export const videoStatusController = async (req: Request, res: Response) => {
  const { id } = req.params
  const data = await mediasService.getVideoStatus(id)

  res.json({
    data
  })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { name } = req.params

  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send(err.message)
    }
  })
}

export const serveM3u8Controller = async (req: Request, res: Response) => {
  const { id } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
    if (err) {
      res.status((err as any).status).send(err.message)
    }
  })
}

export const serveSegmentController = async (req: Request, res: Response) => {
  const { id, v, segment } = req.params

  res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
    if (err) {
      res.status((err as any).status).send(err.message)
    }
  })
}

// * custom streaming video
export const serveVideoStreamController = async (req: Request, res: Response) => {
  const range = req.headers.range

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1MB = 10^6 bytes (tính theo hệ thập phân, đây là thứ mà chúng ta hay thấy trên UI)
  // Còn nếu tính theo hệ nhị phân thì 1MB = 2^20 bytes (1024*1024)

  // Tính dung lượng video
  const videoSize = fs.statSync(videoPath).size //lấy dung lượng video
  // Dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 10 ** 6
  // lấy giá trị bytes bắt đầu từ header range
  const start = Number(range.replace(/\D/g, ''))
  // lấy giá trị bytes kết thúc , vượt quá dung lượng video thì lấy giá trị videoSize
  const end = Math.min(start + chunkSize, videoSize - 1)

  // dung lượng thực  tế cho mỗi đoạn video stream
  // thường đây sẽ là chunksize , ngoại trừ đoạn cuối
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStreams = fs.createReadStream(videoPath, { start, end })
  videoStreams.pipe(res)
}
