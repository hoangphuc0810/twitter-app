import { Response, Request, NextFunction } from 'express'
import { pick } from 'lodash'
type FilterKeys<T> = Array<keyof T>

export const filterKeyMiddleware = <T>(filterKeys: FilterKeys<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
}
