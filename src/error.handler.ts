import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err?.status === 503) {
    return res.status(503).json({
      error: 'External data source unavailable',
      details: err.details || {},
    });
  }

  if (err?.status === 400) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details || {},
    });
  }

  res.status(500).json({ error: 'Internal server error' });
}
