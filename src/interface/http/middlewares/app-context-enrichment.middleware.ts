import { RequestHandler } from 'express';

import { IReadRepoOptions } from '@shared/types/repo.types';

import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';
import IUserRepo from '@domain/user/repos/user.repo';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IAppContext from '@app/context/contracts/app-context.contract';

import getAccountingEntityFromRequest from '@interface/http/helpers/get-accounting-entity-from-request.helper';
import getAuthUserFromRequest from '@interface/http/helpers/get-auth-user-from-request.helper';

export default function makeAppContextEnrichmentMiddleware(
  appContext: IAppContext,
  accountingEntityRepo: IAccountingEntityRepo,
  tokenService: ITokenService,
  userRepo: IUserRepo
): RequestHandler {
  return async (req, _res, next) => {
    const { correlationId } = appContext.get();
    const repoOptions: IReadRepoOptions = { correlationId };

    const user = await getAuthUserFromRequest(
      req,
      tokenService,
      userRepo,
      repoOptions
    );

    const accountingEntity = await getAccountingEntityFromRequest(
      req,
      accountingEntityRepo,
      repoOptions,
      user?.id
    );

    if (user || accountingEntity) {
      appContext.set({
        ...(user && { user }),
        ...(accountingEntity && { accountingEntity }),
      });
    }

    next();
  };
}
