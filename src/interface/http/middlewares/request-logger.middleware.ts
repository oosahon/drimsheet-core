import { RequestHandler } from 'express';
import { performance } from 'perf_hooks';
import ILogger from '../../../app/shared/contracts/logger.contract';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import IRequestContext from '../../../app/shared/contracts/request-context.contract';

export default function makeRequestLoggerMiddleware(
  logger: ILogger,
  reporter: IReporter,
  requestContext: IRequestContext
): RequestHandler {
  const SLOW_REQUEST_THRESHOLD =
    Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 1000;

  return (req, res, next) => {
    const start = performance.now();

    const { correlationId } = requestContext.get();

    const handleFinish = () => {
      const duration = Math.round(performance.now() - start);

      const responseLog = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: parseInt(
          (res.getHeader('content-length') as string) || '0',
          10
        ),
        correlationId,
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
      };

      const isClientError = res.statusCode >= 400 && res.statusCode < 500;
      const isServerError = res.statusCode >= 500;
      const isSlowRequest = duration > SLOW_REQUEST_THRESHOLD;

      if (isSlowRequest) {
        reporter.report(
          new Error(`[SLOW]: ${req.method} ${req.originalUrl}`),
          responseLog
        );
      }

      const resTitle = `[${res.statusCode}] ${req.method} ${req.originalUrl}`;

      if (isServerError) {
        // error is already being reported in src/interface/http/handlers/error.handler.ts
        logger.error(resTitle, responseLog);
      } else if (isClientError || isSlowRequest) {
        logger.warn(resTitle, responseLog);
      } else {
        logger.info(resTitle, responseLog);
      }
    };

    res.on('finish', handleFinish);

    next();
  };
}
