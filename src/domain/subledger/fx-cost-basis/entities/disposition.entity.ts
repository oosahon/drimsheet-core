import { TAuditedEntity } from '../../../../shared/events/types/event.types';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import exchangeRateValue from '../../../money/values/exchange-rate.vo';
import FxCostBasisLotDispositionError from '../errors/disposition.error';
import FxCostBasisLotDispositionEvents from '../events/disposition.events';
import {
  EFxCostBasisLotDispositionAuditAction,
  IFxCostBasisLotDisposition,
} from '../types/disposition.types';
import helpers from './helpers/disposition.entity.helpers';

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

  helpers.validateQuantity(payload.quantity);
  helpers.validateCostBasisConsumed(payload.costBasisConsumed);
  helpers.validateProceeds(payload.proceeds);
  helpers.validateRealizedGainLoss(payload.realizedGainLoss);
  exchangeRateValue.validate(payload.dispositionRate);
  helpers.validateOfficialRate(payload.officialRate);
  dateUtils.validateDateIsNotInTheFuture(
    payload.dispositionDate,
    FxCostBasisLotDispositionError.InvalidDispositionDate
  );

  const timestamp = new Date();

  const entity: IFxCostBasisLotDisposition = Object.freeze({
    id: generateUUID(),
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

  const audit = Object.freeze({
    entityId: entity.id,
    action: EFxCostBasisLotDispositionAuditAction.Created,
    diff: {
      before: null,
      after: entity,
    },
    occurredAt: timestamp,
  });

  return [entity, [event], audit];
}

const fxCostBasisLotDispositionEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxCostBasisLotDispositionEntity;
