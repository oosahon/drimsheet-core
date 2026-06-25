import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TAuditedEntity } from '../../../../shared/types/event.types';
import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import fxLotError from '../errors/fx-lot.error';
import fxLotEvents from '../events/fx-lot.events';
import { EFxLotAuditAction } from '../types/fx-lot-audit.types';
import { IFxLot } from '../types/fx-lot.types';
import helpers from './helpers/fx-lot.entity.helpers';

function make(
  payload: TCreationOmits<IFxLot>
): TAuditedEntity<IFxLot, IFxLot, IFxLot> {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    fxLotError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    fxLotError.InvalidAccountingEntityId
  );
  helpers.validateStatus(payload.status);
  helpers.validateQuantity(payload.originalQuantity, payload.remainingQuantity);
  helpers.validateCostBasis(payload.costBasis, payload.remainingCostBasis);
  exchangeRateValue.validate(payload.acquisitionRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.acquisitionDate,
    fxLotError.InvalidAcquisitionDate
  );

  const timestamp = new Date();

  const entity: IFxLot = Object.freeze({
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
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = fxLotEvents.created(entity);

  const audit = Object.freeze({
    entityId: entity.id,
    action: EFxLotAuditAction.Created,
    diff: {
      before: null,
      after: entity,
    },
    occurredAt: timestamp,
  });

  return [entity, [event], audit];
}

const fxLotEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxLotEntity;
