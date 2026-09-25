import { TCreationOmits } from '@shared/types/creation-omits.types';
import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import acquisitionValidation from '@domain/subledger/fx-cost-basis/entities/validations/acquisition.validation';
import FxCostBasisLotAcquisitionError from '@domain/subledger/fx-cost-basis/errors/acquisition.error';
import FxCostBasisLotAcquisitionEvents from '@domain/subledger/fx-cost-basis/events/acquisition.events';
import {
  EFxCostBasisLotAcquisitionAuditAction,
  IFxCostBasisLotAcquisition,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';
import fxCostBasisLotAcquisitionAudit from '@domain/subledger/fx-cost-basis/values/acquisition-audit.vo';

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

  acquisitionValidation.validateQuantity(payload.quantity);
  acquisitionValidation.validateCostBasis(payload.costBasis);
  exchangeRateValue.validate(payload.acquisitionRate);
  acquisitionValidation.validateOfficialRate(payload.officialRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.acquisitionDate,
    FxCostBasisLotAcquisitionError.InvalidAcquisitionDate
  );

  stringUtils.validateUUID(
    payload.createdBy,
    FxCostBasisLotAcquisitionError.InvalidCreatedBy
  );

  const timestamp = new Date();

  const entity: IFxCostBasisLotAcquisition = Object.freeze({
    id: generateUUID(),
    createdBy: payload.createdBy,
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

  const audit = fxCostBasisLotAcquisitionAudit.make({
    before: null,
    after: entity,
    action: EFxCostBasisLotAcquisitionAuditAction.Created,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotAcquisitionEntity = Object.freeze({
  make,
  ...acquisitionValidation,
});

export default fxCostBasisLotAcquisitionEntity;
