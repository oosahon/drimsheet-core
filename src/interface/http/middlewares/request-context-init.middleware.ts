import { RequestHandler } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import { UAccountingEntityType } from '../../../domain/accounting-entity/types/accounting-entity.types';
import { NODE_ENV, WEB_APP_URL } from '../../../infra/config/vars.config';
import generateUUID from '../../../shared/utils/uuid-generator';
import getHttpHeaderValue from '../helpers/get-http-header-value';

/**
 * DOMAIN: global
 *
 * This middleware is used to initialize the request context
 */
export default function requestContextInitMiddleware(
  requestContext: IRequestContext
): RequestHandler {
  return (req, res, next) => {
    const correlationId =
      getHttpHeaderValue('x-correlation-id', req.headers) || generateUUID();
    const idempotencyKey = getHttpHeaderValue('x-idempotency-key', req.headers);
    const accountingEntityType = getHttpHeaderValue(
      'x-accounting-entity-type',
      req.headers
    );

    const { user = {} } = res.locals;

    requestContext.init(
      {
        user,
        correlationId,
        idempotencyKey: idempotencyKey || '',
        accountingEntityType: accountingEntityType as UAccountingEntityType,
        clientSession: {
          setRefreshToken: (token: string) => {
            res.cookie('refresh_token', token, {
              httpOnly: true,
              secure: NODE_ENV === 'production',
              domain: new URL(WEB_APP_URL).hostname,
              sameSite: 'lax',
              maxAge: 1000 * 60 * 60 * 24 * 7,
            });
          },

          getRefreshToken: () => {
            return req.cookies.refresh_token;
          },
        },
      },
      next
    );
  };
}
