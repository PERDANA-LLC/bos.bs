import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (res.headersSent) {
    return next(error)
  }

  const statusCode = (error as any).statusCode || 500
  const message = isDevelopment ? error.message : 'Internal server error'

  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: error.stack }),
  })
}