import { Request } from 'express';

import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';
import appError from '@shared/values/errors/app.error';

import getHttpHeaderValue from './get-http-header-value';

export default function getAccountingEntityIdFromRequest(
  req: Request
): TEntityId | undefined {
  const accountingEntityId = getHttpHeaderValue(
    'x-accounting-entity-id',
    req.headers
  );

  if (!accountingEntityId) return undefined;

  if (!stringUtils.isUUID(accountingEntityId)) {
    throw new appError.BadRequest();
  }

  return accountingEntityId as TEntityId;
}
