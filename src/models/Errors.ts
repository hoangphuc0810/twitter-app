import HTTP_STATUS from '~/constants/httpStatus'

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorType
  constructor({ errors }: { message?: string; errors: ErrorType }) {
    super({ message: 'giá trị không hợp lệ ', status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
