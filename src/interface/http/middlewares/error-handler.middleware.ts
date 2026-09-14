import { ErrorRequestHandler } from 'express';

import httpHandlers from '@infra/ioc/handlers/http';

const makeErrorHandlerMiddleware = (): ErrorRequestHandler => {
  return (error, _req, res, _next) => {
    return httpHandlers.error(_req, res, error);
  };
};

export default makeErrorHandlerMiddleware;
