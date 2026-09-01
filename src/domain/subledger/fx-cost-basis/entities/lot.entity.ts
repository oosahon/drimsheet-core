import { TCreationOmits } from '@shared/types/creation-omits.types';
import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import moneyValue from '@domain/money/values/money.vo';
import helpers from '@domain/subledger/fx-cost-basis/entities/helpers/lot.entity.helpers';
import fxCostBasisLotError from '@domain/subledger/fx-cost-basis/errors/lot.error';
import FxCostBasisLotEvents from '@domain/subledger/fx-cost-basis/events/lot.events';
import {
  EFxCostBasisLotAuditAction,
  EFxCostBasisLotStatus,
  IFxCostBasisLot,
} from '@domain/subledger/fx-cost-basis/types/lot.types';
import fxCostBasisLotAudit from '@domain/subledger/fx-cost-basis/values/lot-audit.vo';

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

  const audit = fxCostBasisLotAudit.make({
    before: null,
    after: entity,
    action: EFxCostBasisLotAuditAction.Created,
  });

  return [entity, [event], audit];
}

function consume(
  lot: IFxCostBasisLot,
  quantity: IFxCostBasisLot['remainingQuantity'],
  costBasis: IFxCostBasisLot['remainingCostBasis']
): TAuditedEntity<IFxCostBasisLot, IFxCostBasisLot, IFxCostBasisLot> {
  helpers.validateConsumption(lot, quantity, costBasis);

  const remainingQuantity = moneyValue.subtract(
    lot.remainingQuantity,
    quantity
  );
  const remainingCostBasis = moneyValue.subtract(
    lot.remainingCostBasis,
    costBasis
  );
  const isClosed = moneyValue.isZeroAmount(remainingQuantity);

  helpers.validateConsumptionRemainder(
    remainingQuantity,
    remainingCostBasis,
    costBasis
  );

  const timestamp = new Date();

  const status = isClosed
    ? EFxCostBasisLotStatus.Closed
    : EFxCostBasisLotStatus.Open;

  const entity: IFxCostBasisLot = Object.freeze({
    id: lot.id,
    ledgerAccountId: lot.ledgerAccountId,
    accountingEntityId: lot.accountingEntityId,
    status,
    originalQuantity: lot.originalQuantity,
    remainingQuantity,
    costBasis: lot.costBasis,
    remainingCostBasis,
    acquisitionRate: lot.acquisitionRate,
    acquisitionDate: lot.acquisitionDate,
    version: lot.version + 1,
    createdAt: lot.createdAt,
    updatedAt: timestamp,
  });

  const event = FxCostBasisLotEvents.disposed(entity);

  const action = isClosed
    ? EFxCostBasisLotAuditAction.Closed
    : EFxCostBasisLotAuditAction.Disposed;

  const audit = fxCostBasisLotAudit.make({
    before: lot,
    after: entity,
    action,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotEntity = Object.freeze({
  make,
  consume,

  ...helpers,
});

export default fxCostBasisLotEntity;
