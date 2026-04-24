import { Request } from 'express';
import IAccountingEntityRepo from '../../../domain/accounting-entity/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../domain/accounting-entity/types/accounting-entity.types';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import { ErrorBadRequest } from '../../../shared/value-objects/error';
import getHttpHeaderValue, { getCorrelationId } from './get-http-header-value';

export default async function getAccountingEntityFromRequest(
  req: Request,
  repo: IAccountingEntityRepo,
  userId?: TEntityId
): Promise<IAccountingEntity | null> {
  if (!userId) return null;

  const id = getHttpHeaderValue('x-accounting-entity-id', req.headers);

  if (!id) return null;

  const isValidUUID = stringUtils.isUUID(id);

  if (!isValidUUID) throw new ErrorBadRequest('Invalid accounting entity.');

  const accountingEntity = await repo.findById(id as TEntityId, {
    correlationId: getCorrelationId(req),
  });

  if (!accountingEntity) return null;

  return accountingEntity;
}
