import { RequestHandler } from 'express';
import ILogger from '../../../app/contracts/infra/logger.contract';

export default function requestLoggerMiddleware(
  logger: ILogger
): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();

    const correlationId = req.headers['x-correlation-id'] as string;

    logger.info('incoming request', {
      method: req.method,
      url: req.originalUrl,
      correlationId,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;

      logger.info('outgoing response', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: res.getHeader('content-length') || 0,
        correlationId,
      });
    });

    next();
  };
}
