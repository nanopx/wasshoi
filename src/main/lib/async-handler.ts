import { RequestHandler } from 'express'

const asyncHandler = (handler: RequestHandler): RequestHandler => (
  req,
  res,
  next
) => {
  const handlerReturn = handler(req, res, next)
  return Promise.resolve(handlerReturn).catch((e) => next(e))
}

export default asyncHandler
