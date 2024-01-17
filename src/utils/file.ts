import path from 'path'
import fs from 'fs'
import formidable, { File } from 'formidable'
import { Request } from 'express'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir.'
import { v4 as uuidv4 } from 'uuid'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // mục đích để tạo folder nested
      })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const options: formidable.Options = {
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR), // lưu hình ảnh tới folder có tên images
    maxFields: 4, // chỉ up được 1 ảnh
    keepExtensions: true, //lấy đuôi của hình
    maxFileSize: 300 * 1024, //300KB
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const validMimtype = mimetype && mimetype.includes('image/')
      const validName = name && name === 'image'

      if (!validMimtype) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: 'File type is not valid', status: HTTP_STATUS.BAD_REQUEST }) as any
        )
      }
      if (!validName) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: 'Name is not valid', status: HTTP_STATUS.BAD_REQUEST }) as any
        )
      }

      return true
    }
  }
  const form = formidable(options)
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      const filesIsEmpty = files && files.image

      if (err) {
        return reject(err)
      }
      if (!filesIsEmpty) {
        return reject(new ErrorWithStatus({ message: 'File is not empty', status: HTTP_STATUS.BAD_REQUEST }))
      }

      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  let idName = uuidv4().split('-').join('') // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  const formidable = (await import('formidable')).default
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const options: formidable.Options = {
    uploadDir: folderPath, // lưu hình ảnh tới folder có tên ...
    maxFields: 1, // chỉ up được 1 ảnh
    maxFileSize: 50 * 1024 * 1024, //300KB
    filter: function ({ name, originalFilename, mimetype }) {
      const validMimtype = (mimetype && mimetype.includes('mp4')) || mimetype?.includes('quicktime')
      const validName = name && name === 'video'

      if (!validMimtype) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: 'File type is not valid', status: HTTP_STATUS.BAD_REQUEST }) as any
        )
      }
      if (!validName) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: 'Name is not valid', status: HTTP_STATUS.BAD_REQUEST }) as any
        )
      }
      return true
    },
    filename: function () {
      return idName
    }
  }
  const form = formidable(options)
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      const filesIsEmpty = files && files.video

      if (err) {
        return reject(err)
      }
      if (!filesIsEmpty) {
        return reject(new ErrorWithStatus({ message: 'File is not empty', status: HTTP_STATUS.BAD_REQUEST }))
      }

      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`)
        video.newFilename = `${video.newFilename}.${ext}`
        video.filepath = `${video.filepath}.${ext}`
      })
      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullName = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}

export const getExtension = (originalFilename: string) => {
  const ext = originalFilename.split('.')
  return ext[ext.length - 1]
}
