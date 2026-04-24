import { RequestHandler } from 'express';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';
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
