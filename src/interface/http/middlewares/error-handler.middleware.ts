import { ErrorRequestHandler } from 'express';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import httpHandlers from '../handlers';

const errorHandlerMiddleware = (
  logger: ILogger,
  reporter: IReporter
): ErrorRequestHandler => {
  return (error, req, res, next) => {
    return httpHandlers.error(req, res, error);
  };
};

export default errorHandlerMiddleware;
