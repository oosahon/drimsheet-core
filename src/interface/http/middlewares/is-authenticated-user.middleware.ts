import { RequestHandler } from 'express';
import _ from 'lodash';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import accountingEntityEntity from '../../../domain/accounting-entity/entities/accounting-entity.entity';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import httpHandlers from '../handlers';

export default function isAuthenticatedUserMiddleware(
  requestContext: IRequestContext
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user, accountingEntity } = requestContext.get();

      if (_.isEmpty(user)) {
        throw new ErrorUnauthorized();
      }

      if (!_.isEmpty(accountingEntity)) {
        accountingEntityEntity.validateAccess(accountingEntity, user);
      }

      next();
    } catch (error) {
      httpHandlers.error(req, res, error);
    }
  };
}
