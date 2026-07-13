import { Request } from 'express';
import IAuthService from '../../../app/auth/contracts/auth-service.contract';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import ILogger from '../../../shared/contracts/logger.contract';
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

  const authUser = await authService.getAuthUser(token);

  const user = await userRepo.findById(authUser.id, { correlationId });

  return user;
}
