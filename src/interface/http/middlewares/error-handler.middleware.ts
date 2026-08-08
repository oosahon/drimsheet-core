import { ErrorRequestHandler } from 'express';

import httpHandlers from '@interface/http/handlers';

const makeErrorHandlerMiddleware = (): ErrorRequestHandler => {
  return (error, _req, res, _next) => {
    return httpHandlers.error(_req, res, error);
  };
};

export default makeErrorHandlerMiddleware;
