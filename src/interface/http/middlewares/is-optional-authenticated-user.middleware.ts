import { RequestHandler } from 'express';
import httpErrorHandler from '../handlers/error.handler';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';

export default function isOptionalAuthenticatedUserMiddleware(
  logger: ILogger,
  reporter: IReporter
): RequestHandler {
  return async (req, res, next) => {
    try {
      // TODO: implement
      next();
    } catch (error) {
      httpErrorHandler(logger, reporter)(req, res, error);
    }
  };
}
