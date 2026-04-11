import { RequestHandler } from 'express';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import IRequestContext from '../../../app/contracts/app/request-context.contract';

export default function requestLoggerMiddleware(
  logger: ILogger,
  reporter: IReporter,
  requestContext: IRequestContext
): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();

    const { correlationId } = requestContext.get();

    const reqTitle = `${req.method} ${req.originalUrl}`;
    logger.info(reqTitle, {
      correlationId,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;

      const responseLog = {
        duration: `${duration}ms`,
        responseSize: res.getHeader('content-length') || 0,
        correlationId,
      };

      const isBadRequest = res.statusCode >= 400 && res.statusCode < 500;
      const isSlowRequest = duration > 1000;

      const shouldWarn = isBadRequest || isSlowRequest;

      if (isSlowRequest) {
        reporter.report(
          new Error(`[SLOW]: ${req.method} ${req.originalUrl}`),
          responseLog
        );
      }

      const resTitle = `[${res.statusCode}] ${req.method} ${req.originalUrl}`;
      if (shouldWarn) {
        logger.warn(resTitle, responseLog);
      } else {
        logger.info(resTitle, responseLog);
      }
    });

    next();
  };
}
