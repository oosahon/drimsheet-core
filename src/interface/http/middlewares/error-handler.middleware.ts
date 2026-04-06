import { ErrorRequestHandler } from 'express';

import httpErrorHandler from '../handlers/error.handler';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';

const errorHandlerMiddleware = (
  logger: ILogger,
  reporter: IReporter
): ErrorRequestHandler => {
  return (error, req, res, next) => {
    const handler = httpErrorHandler(logger, reporter);

    return handler(req, res, error);
  };
};

export default errorHandlerMiddleware;
