import { RequestHandler } from 'express';
import IAppContext from '../../../app/context/contracts/app-context.contract';
import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';

export default function makeAccountingEntityAccessMiddleware(
  accountingEntityService: IAccountingEntityService,
  appContext: IAppContext
): RequestHandler {
  return async (req, res, next) => {
    const { user, accountingEntity } = appContext.get();

    accountingEntityService.validateAccess(accountingEntity, user.id);

    next();
  };
}
