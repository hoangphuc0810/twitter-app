import { Request, Response, NextFunction } from 'express'

export const wrapResquestHandler = (func: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
