import { RequestHandler } from 'express';
import _ from 'lodash';
import appError from '../../../app/shared/errors/app.error';
import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import httpHandlers from '../handlers';

export default function makeIsAuthenticatedUserMiddleware(
  requestContext: IRequestContext,
  accountingEntityService: IAccountingEntityService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user, accountingEntity } = requestContext.get();

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
