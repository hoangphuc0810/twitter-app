import { ObjectId } from 'mongodb'
import { EncodingStatus } from '~/constants/enums'

export interface VideoStatusType {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  created_at?: Date
  update_at?: Date
}

export default class VideoStatus {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  created_at?: Date
  update_at?: Date

  constructor({ message, name, status, update_at, _id, created_at }: VideoStatus) {
    const nowDate = new Date()
    this._id = _id
    this.message = message || ''
    this.name = name
    this.status = status
    this.created_at = created_at || nowDate
    this.update_at = update_at || nowDate
  }
}
