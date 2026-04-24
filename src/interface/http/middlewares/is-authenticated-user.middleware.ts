import { RequestHandler } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import httpHandlers from '../handlers';

export default function isAuthenticatedUserMiddleware(
  requestContext: IRequestContext
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user } = requestContext.get();

      if (!user) {
        throw new ErrorUnauthorized();
      }
      next();
    } catch (error) {
      httpHandlers.error(req, res, error);
    }
  };
}
