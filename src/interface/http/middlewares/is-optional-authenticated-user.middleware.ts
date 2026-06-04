import { RequestHandler } from 'express';
import ILogger from '../../../app/shared/contracts/logger.contract';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import httpHandlers from '../handlers';

export default function makeIsOptionalAuthenticatedUserMiddleware(
  logger: ILogger,
  reporter: IReporter
): RequestHandler {
  return async (req, res, next) => {
    try {
      // TODO: implement
      next();
    } catch (error) {
      httpHandlers.error(req, res, error);
    }
  };
}
