import { Request } from 'express';
import IAuthService, {
  IAuthTokenPayload,
} from '../../../app/contracts/infra/auth-service.contract';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import getHttpHeaderValue, { getCorrelationId } from './get-http-header-value';

export default async function getAuthUserFromRequest(
  req: Request,
  authService: IAuthService,
  logger: ILogger,
  userRepo: IUserRepo
): Promise<IUser | null> {
  const bearerToken = getHttpHeaderValue('authorization', req.headers);
  const correlationId = getCorrelationId(req);

  if (!bearerToken) return null;

  const token = bearerToken.split(' ')[1];

  if (!token) return null;

  let authUser: IAuthTokenPayload | null = null;

  try {
    authUser = await authService.getAuthUser(token);
  } catch (error) {
    logger.error('An error occurred while decoding token', {
      error,
      correlationId,
    });
    return null;
  }

  if (!authUser) return null;

  const user = await userRepo.findById(authUser.id, { correlationId });

  return user;
}
