import { RequestHandler } from 'express';
import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IRequestContext from '../../../shared/contracts/request-context.contract';

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
