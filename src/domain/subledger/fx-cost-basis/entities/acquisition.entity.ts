import { TCreationOmits } from '@shared/types/creation-omits.types';
import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import helpers from '@domain/subledger/fx-cost-basis/entities/helpers/acquisition.entity.helpers';
import FxCostBasisLotAcquisitionError from '@domain/subledger/fx-cost-basis/errors/acquisition.error';
import FxCostBasisLotAcquisitionEvents from '@domain/subledger/fx-cost-basis/events/acquisition.events';
import {
  EFxCostBasisLotAcquisitionAuditAction,
  IFxCostBasisLotAcquisition,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';

function make(
  payload: TCreationOmits<IFxCostBasisLotAcquisition>
): TAuditedEntity<
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisition
> {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    FxCostBasisLotAcquisitionError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    FxCostBasisLotAcquisitionError.InvalidAccountingEntityId
  );
  stringUtils.validateUUID(
    payload.lotId,
    FxCostBasisLotAcquisitionError.InvalidLotId
  );

  stringUtils.validateUUID(
    payload.journalEntryId,
    FxCostBasisLotAcquisitionError.InvalidJournalEntryId
  );

  helpers.validateQuantity(payload.quantity);
  helpers.validateCostBasis(payload.costBasis);
  exchangeRateValue.validate(payload.acquisitionRate);
  helpers.validateOfficialRate(payload.officialRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.acquisitionDate,
    FxCostBasisLotAcquisitionError.InvalidAcquisitionDate
  );

  const timestamp = new Date();

  const entity: IFxCostBasisLotAcquisition = Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    accountingEntityId: payload.accountingEntityId,
    lotId: payload.lotId,
    journalEntryId: payload.journalEntryId,
    quantity: payload.quantity,
    costBasis: payload.costBasis,
    acquisitionRate: payload.acquisitionRate,
    acquisitionDate: payload.acquisitionDate,
    officialRate: payload.officialRate,
    createdAt: timestamp,
  });

  const event = FxCostBasisLotAcquisitionEvents.created(entity);

  const audit = Object.freeze({
    entityId: entity.id,
    action: EFxCostBasisLotAcquisitionAuditAction.Created,
    diff: {
      before: null,
      after: entity,
    },
    occurredAt: timestamp,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotAcquisitionEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxCostBasisLotAcquisitionEntity;
