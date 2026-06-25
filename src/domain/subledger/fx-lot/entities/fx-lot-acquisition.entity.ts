import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TAuditedEntity } from '../../../../shared/types/event.types';
import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import fxLotAcquisitionError from '../errors/fx-lot-acquisition.error';
import fxLotAcquisitionEvents from '../events/fx-lot-acquisition.events';
import { EFxLotAcquisitionAuditAction } from '../types/fx-lot-acquisition-audit.types';
import { IFxLotAcquisition } from '../types/fx-lot.types';
import helpers from './helpers/fx-lot-acquisition.entity.helpers';

function make(
  payload: TCreationOmits<IFxLotAcquisition>
): TAuditedEntity<IFxLotAcquisition, IFxLotAcquisition, IFxLotAcquisition> {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    fxLotAcquisitionError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    fxLotAcquisitionError.InvalidAccountingEntityId
  );
  stringUtils.validateUUID(payload.lotId, fxLotAcquisitionError.InvalidLotId);

  stringUtils.validateUUID(
    payload.journalEntryId,
    fxLotAcquisitionError.InvalidJournalEntryId
  );

  helpers.validateQuantity(payload.quantity);
  helpers.validateCostBasis(payload.costBasis);
  exchangeRateValue.validate(payload.acquisitionRate);
  helpers.validateOfficialRate(payload.officialRate, payload.officialRateId);
  dateUtils.validateDateIsNotInTheFuture(
    payload.acquisitionDate,
    fxLotAcquisitionError.InvalidAcquisitionDate
  );

  const timestamp = new Date();

  const entity: IFxLotAcquisition = Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    accountingEntityId: payload.accountingEntityId,
    lotId: payload.lotId,
    journalEntryId: payload.journalEntryId,
    quantity: payload.quantity,
    costBasis: payload.costBasis,
    acquisitionRate: payload.acquisitionRate,
    officialRate: payload.officialRate,
    officialRateId: payload.officialRateId,
    acquisitionDate: payload.acquisitionDate,
    createdAt: timestamp,
  });

  const event = fxLotAcquisitionEvents.created(entity);

  const audit = Object.freeze({
    entityId: entity.id,
    action: EFxLotAcquisitionAuditAction.Created,
    diff: {
      before: null,
      after: entity,
    },
    occurredAt: timestamp,
  });

  return [entity, [event], audit];
}

const fxLotAcquisitionEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxLotAcquisitionEntity;
