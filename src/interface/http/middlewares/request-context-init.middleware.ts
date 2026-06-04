import { RequestHandler, Response } from 'express';
import IAuthService from '../../../app/shared/contracts/auth-service.contract';
import ILogger from '../../../app/shared/contracts/logger.contract';
import IRequestContext from '../../../app/shared/contracts/request-context.contract';
import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import { NODE_ENV, WEB_APP_URL } from '../../../infra/config/vars.config';
import getAccountingEntityFromRequest from '../helpers/get-accounting-entity-from-request.helper';
import getAuthUserFromRequest from '../helpers/get-auth-user-from-request.helper';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '../helpers/get-http-header-value';

function handleSetRefreshToken(res: Response, token: string) {
  const hostname = new URL(WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function handleClearRefreshToken(res: Response) {
  const hostname = new URL(WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
  });
}

/**
 * DOMAIN: global
 *
 * This middleware is used to initialize the request context
 */
export default function makeRequestContextInitMiddleware(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo,
  makeAuthService: IAuthService,
  userRepo: IUserRepo,
  logger: ILogger
): RequestHandler {
  return async (req, res, next) => {
    const correlationId = getCorrelationId(req);
    const idempotencyKey = getIdempotencyKey(req);

    const user = await getAuthUserFromRequest(
      req,
      makeAuthService,
      logger,
      userRepo
    );

    const accountingEntity = await getAccountingEntityFromRequest(
      req,
      accountingEntityRepo,
      user?.id
    );

    requestContext.init(
      {
        user: user ?? ({} as IUser),
        accountingEntity: accountingEntity ?? ({} as IAccountingEntity),
        correlationId,
        idempotencyKey: idempotencyKey || '',
        clientSession: {
          setRefreshToken: (token: string) => handleSetRefreshToken(res, token),
          getRefreshToken: () => {
            return req.cookies.refresh_token;
          },
          clearRefreshToken: () => handleClearRefreshToken(res),
        },
      },
      next
    );
  };
}
