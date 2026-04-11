import { RequestHandler } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import IUserRepo from '../../../domain/user/repos/user.repo';
import httpHandlers from '../handlers';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IAuthService from '../../../app/contracts/infra/auth-service.contract';
import userMapper from '../../../app/mappers/user.mapper';

export default function isAuthenticatedUserMiddleware(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const { correlationId } = requestContext.get();

      if (!token || token === 'null' || token === 'undefined') {
        throw new ErrorUnauthorized();
      }

      const authUser = await authService.getAuthUser(token);

      if (!authUser) {
        throw new ErrorUnauthorized();
      }

      const user = await userRepo.findById(authUser.id, { correlationId });

      if (!user?.emailVerified) {
        throw new ErrorUnauthorized('error.email.unverified');
      }

      requestContext.set({ user: userMapper.toInterface(user) });

      next();
    } catch (error) {
      httpHandlers.error(req, res, error);
    }
  };
}
