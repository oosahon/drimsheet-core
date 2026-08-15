import { RequestHandler } from 'express';

import IAccountingEntityService from '@domain/accounting/types/accounting-entity.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';

export default function makeAccountingEntityAccessMiddleware(
  accountingEntityService: IAccountingEntityService,
  appContext: IAppContext
): RequestHandler {
  return async (req, res, next) => {
    const { user, accountingEntity } = appContext.get([
      'user',
      'accountingEntity',
    ]);

    accountingEntityService.validateAccess(accountingEntity, user.id);

    next();
  };
}
