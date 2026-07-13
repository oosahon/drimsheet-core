import { RequestHandler } from 'express';
import _ from 'lodash';
import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import appError from '../../../shared/errors/app.error';
import httpHandlers from '../handlers';

export default function makeIsAuthenticatedUserMiddleware(
  appContext: IAppContext,
  accountingEntityService: IAccountingEntityService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user, accountingEntity } = appContext.get();

      if (_.isEmpty(user)) {
        throw new appError.Unauthorized();
      }

      if (!_.isEmpty(accountingEntity)) {
        const canAccessEntity = accountingEntityService.grantUserAccess(
          accountingEntity,
          user.id
        );

        if (!canAccessEntity) {
          throw new appError.Forbidden();
        }
      }

      next();
    } catch (error) {
      httpHandlers.error(req, res, error);
    }
  };
}
