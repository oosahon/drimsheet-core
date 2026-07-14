import { RequestHandler, Response } from 'express';
import IAppContext from '../../../app/_internal/contracts/app-context.contract';
import IAuthService from '../../../app/auth/contracts/auth-service.contract';
import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import ILogger from '../../../shared/contracts/logger.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import getAccountingEntityFromRequest from '../helpers/get-accounting-entity-from-request.helper';
import getAuthUserFromRequest from '../helpers/get-auth-user-from-request.helper';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '../helpers/get-http-header-value';

function handleSetRefreshToken(
  res: Response,
  token: string,
  varsConfig: IVarsConfig
) {
  const hostname = new URL(varsConfig.WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: varsConfig.NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function handleClearRefreshToken(res: Response, varsConfig: IVarsConfig) {
  const hostname = new URL(varsConfig.WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: varsConfig.NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
  });
}

/**
 * DOMAIN: global
 *
 * This middleware is used to initialize the request context
 */
export default function makeAppContextInitMiddleware(
  appContext: IAppContext,
  accountingEntityRepo: IAccountingEntityRepo,
  authService: IAuthService,
  userRepo: IUserRepo,
  logger: ILogger,
  varsConfig: IVarsConfig
): RequestHandler {
  return async (req, res, next) => {
    const correlationId = getCorrelationId(req);
    const idempotencyKey = getIdempotencyKey(req);

    const user = await getAuthUserFromRequest(
      req,
      authService,
      logger,
      userRepo
    );

    const accountingEntity = await getAccountingEntityFromRequest(
      req,
      accountingEntityRepo,
      user?.id
    );

    appContext.init(
      {
        user: user ?? ({} as IUser),
        accountingEntity: accountingEntity ?? ({} as IAccountingEntity),
        correlationId,
        idempotencyKey: idempotencyKey || '',
        clientSession: {
          setRefreshToken: (token: string) =>
            handleSetRefreshToken(res, token, varsConfig),
          getRefreshToken: () => {
            return req.cookies.refresh_token;
          },
          clearRefreshToken: () => handleClearRefreshToken(res, varsConfig),
        },
      },
      next
    );
  };
}
