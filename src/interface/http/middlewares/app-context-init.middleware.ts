import { RequestHandler, Response } from 'express';

import ILogger from '@shared/contracts/logger.contract';
import IVarsConfig from '@shared/contracts/vars-config.contract';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import IUserRepo from '@domain/user/repos/user.repo';
import { IUser } from '@domain/user/types/user.types';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IAppContext from '@app/context/contracts/app-context.contract';
import IUserPreferencesAppService from '@app/user/contracts/user-preferences-app.service.contract';

import getAccountingEntityIdFromRequest from '@interface/http/helpers/get-accounting-entity-id-from-request.helper';
import getAuthUserFromRequest from '@interface/http/helpers/get-auth-user-from-request.helper';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '@interface/http/helpers/get-http-header-value';

function handleSetRefreshToken(
  res: Response,
  token: string,
  varsConfig: IVarsConfig
) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: varsConfig.NODE_ENV === 'production',
    path: '/api/v1/auth',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 15,
  });
}

function handleClearRefreshToken(res: Response, varsConfig: IVarsConfig) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: varsConfig.NODE_ENV === 'production',
    path: '/api/v1/auth',
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
  userPreferencesAppService: IUserPreferencesAppService,
  tokenService: ITokenService,
  userRepo: IUserRepo,
  logger: ILogger,
  varsConfig: IVarsConfig
): RequestHandler {
  return async (req, res, next) => {
    const correlationId = getCorrelationId(req);
    const idempotencyKey = getIdempotencyKey(req);

    const user = await getAuthUserFromRequest(
      req,
      tokenService,
      logger,
      userRepo
    );

    let accountingEntity: IAccountingEntity | null = null;

    if (user) {
      const explicitAccountingEntityId = getAccountingEntityIdFromRequest(req);

      accountingEntity =
        await userPreferencesAppService.getActiveAccountingEntity(
          user.id,
          explicitAccountingEntityId,
          { correlationId }
        );
    }

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
