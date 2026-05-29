import { RequestHandler } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';

export default function makeAccountingEntityAccessMiddleware(
  accountingEntityService: IAccountingEntityService,
  requestContext: IRequestContext
): RequestHandler {
  return async (req, res, next) => {
    const { user, accountingEntity } = requestContext.get();

    accountingEntityService.validateAccess(accountingEntity, user.id);

    next();
  };
}
