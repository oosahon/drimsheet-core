import { TCreationOmits } from '@shared/types/creation-omits.types';
import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import dispositionValidation from '@domain/subledger/fx-cost-basis/entities/validations/disposition.validation';
import FxCostBasisLotDispositionError from '@domain/subledger/fx-cost-basis/errors/disposition.error';
import FxCostBasisLotDispositionEvents from '@domain/subledger/fx-cost-basis/events/disposition.events';
import {
  EFxCostBasisLotDispositionAuditAction,
  IFxCostBasisLotDisposition,
} from '@domain/subledger/fx-cost-basis/types/disposition.types';
import fxCostBasisLotDispositionAudit from '@domain/subledger/fx-cost-basis/values/disposition-audit.vo';

function make(
  payload: TCreationOmits<IFxCostBasisLotDisposition>
): TAuditedEntity<
  IFxCostBasisLotDisposition,
  IFxCostBasisLotDisposition,
  IFxCostBasisLotDisposition
> {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    FxCostBasisLotDispositionError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    FxCostBasisLotDispositionError.InvalidAccountingEntityId
  );
  stringUtils.validateUUID(
    payload.journalEntryId,
    FxCostBasisLotDispositionError.InvalidJournalEntryId
  );

  dispositionValidation.validateQuantity(payload.quantity);
  dispositionValidation.validateCostBasisConsumed(payload.costBasisConsumed);
  dispositionValidation.validateProceeds(payload.proceeds);
  dispositionValidation.validateRealizedGainLoss(payload.realizedGainLoss);
  dispositionValidation.validateFunctionalCurrency(payload);
  dispositionValidation.validateRealizedGainLossFormula(payload);
  exchangeRateValue.validate(payload.dispositionRate);
  dispositionValidation.validateOfficialRate(payload.officialRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.dispositionDate,
    FxCostBasisLotDispositionError.InvalidDispositionDate
  );

  stringUtils.validateUUID(
    payload.createdBy,
    FxCostBasisLotDispositionError.InvalidCreatedBy
  );

  const timestamp = new Date();

  const entity: IFxCostBasisLotDisposition = Object.freeze({
    id: generateUUID(),
    createdBy: payload.createdBy,
    ledgerAccountId: payload.ledgerAccountId,
    accountingEntityId: payload.accountingEntityId,
    journalEntryId: payload.journalEntryId,
    quantity: payload.quantity,
    costBasisConsumed: payload.costBasisConsumed,
    proceeds: payload.proceeds,
    realizedGainLoss: payload.realizedGainLoss,
    dispositionRate: payload.dispositionRate,
    officialRate: payload.officialRate,
    dispositionDate: payload.dispositionDate,
    createdAt: timestamp,
  });

  const event = FxCostBasisLotDispositionEvents.created(entity);

  const audit = fxCostBasisLotDispositionAudit.make({
    before: null,
    after: entity,
    action: EFxCostBasisLotDispositionAuditAction.Created,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotDispositionEntity = Object.freeze({
  make,
  ...dispositionValidation,
});

export default fxCostBasisLotDispositionEntity;
