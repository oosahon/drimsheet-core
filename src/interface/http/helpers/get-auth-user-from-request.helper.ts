import { Request } from 'express';

import ILogger from '@shared/contracts/logger.contract';

import IUserRepo from '@domain/user/repos/user.repo';
import { IUser } from '@domain/user/types/user.types';

import ITokenService from '@app/auth/contracts/token-service.contract';

import getHttpHeaderValue, { getCorrelationId } from './get-http-header-value';

export default async function getAuthUserFromRequest(
  req: Request,
  tokenService: ITokenService,
  logger: ILogger,
  userRepo: IUserRepo
): Promise<IUser | null> {
  const bearerToken = getHttpHeaderValue('authorization', req.headers);
  const correlationId = getCorrelationId(req);

  if (!bearerToken) return null;

  const parts = bearerToken.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }
  const token = parts[1];

  const authUser = await tokenService.getAuthUser(token);

  const user = await userRepo.findById(authUser.id, { correlationId });

  return user;
}
