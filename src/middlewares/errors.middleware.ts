import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'

export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.log(error);
  res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(error)
}
