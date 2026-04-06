import { RequestHandler } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import generateUUID from '../../../shared/utils/uuid-generator';
import { UAccountingEntityType } from '../../../domain/accounting/types/accounting.types';
import getHttpHeaderValue from '../helpers/get-http-header-value';

/**
 * DOMAIN: global
 *
 * This middleware is used to initialize the request context
 */
export default function requestContextMiddleware(
  requestContext: IRequestContext
): RequestHandler {
  return (req, res, next) => {
    const correlationId = getHttpHeaderValue('x-correlation-id', req.headers);
    const idempotencyKey = getHttpHeaderValue('x-idempotency-key', req.headers);
    const accountingEntityType = getHttpHeaderValue(
      'x-accounting-entity-type',
      req.headers
    );

    const { user = {} } = res.locals;

    requestContext.init(
      {
        user,
        correlationId: correlationId || generateUUID(),
        idempotencyKey: idempotencyKey || '',
        accountingEntityType: accountingEntityType as UAccountingEntityType,
      },
      next
    );
  };
}
