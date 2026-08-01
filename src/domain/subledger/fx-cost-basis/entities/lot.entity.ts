import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import exchangeRateValue from '../../../money/values/exchange-rate.vo';
import fxCostBasisLotError from '../errors/lot.error';
import FxCostBasisLotEvents from '../events/lot.events';
import {
  EFxCostBasisLotAuditAction,
  IFxCostBasisLot,
} from '../types/lot.types';
import helpers from './helpers/lot.entity.helpers';

function make(
  payload: TCreationOmits<IFxCostBasisLot>
): TAuditedEntity<IFxCostBasisLot, IFxCostBasisLot, IFxCostBasisLot> {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    fxCostBasisLotError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    fxCostBasisLotError.InvalidAccountingEntityId
  );
  helpers.validateStatus(payload.status);
  helpers.validateQuantity(payload.originalQuantity, payload.remainingQuantity);
  helpers.validateCostBasis(payload.costBasis, payload.remainingCostBasis);
  exchangeRateValue.validate(payload.acquisitionRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.acquisitionDate,
    fxCostBasisLotError.InvalidAcquisitionDate
  );

  const timestamp = new Date();

  const entity: IFxCostBasisLot = Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    accountingEntityId: payload.accountingEntityId,
    status: payload.status,
    originalQuantity: payload.originalQuantity,
    remainingQuantity: payload.remainingQuantity,
    costBasis: payload.costBasis,
    remainingCostBasis: payload.remainingCostBasis,
    acquisitionRate: payload.acquisitionRate,
    acquisitionDate: payload.acquisitionDate,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = FxCostBasisLotEvents.created(entity);

  const audit = Object.freeze({
    entityId: entity.id,
    action: EFxCostBasisLotAuditAction.Created,
    diff: {
      before: null,
      after: entity,
    },
    occurredAt: timestamp,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxCostBasisLotEntity;
