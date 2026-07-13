import moneyValue from '../../../domain/money/values/money.vo';
import { IEvent } from '../../../shared/events/types/event.types';
import dateUtils from '../../../shared/utils/date';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import journalLineError from '../errors/journal-line.error';
import journalLineEvents from '../events/journal-line-item.events';
import {
  EJournalLineAuditAction,
  IJournalLineAudit,
} from '../types/journal-entry-audit.types';
import { IJournalEntry } from '../types/journal-entry.types';
import {
  IJournalLine,
  IJournalLineMakePayload,
} from '../types/journal-line.types';
import journalLineAudit from '../values/journal-line-audit.vo';
import helpers from './helpers/journal-line.helpers';

function make(
  entryPayload: Pick<IJournalEntry, 'id' | 'memo' | 'createdAt'>,
  payload: IJournalLineMakePayload
): [IJournalLine, IEvent<IJournalLine>[], IJournalLineAudit] {
  stringUtils.validateUUID(
    entryPayload.id,
    journalLineError.InvalidHeaderyEntryId
  );
  stringUtils.validateUUID(
    payload.accountId,
    journalLineError.InvalidAccountId
  );
  numberUtils.validateInteger(
    payload.sequenceOrder,
    journalLineError.InvalidSequenceOrder
  );
  moneyValue.validate(payload.amount);

  helpers.validateExchangeRate(payload);
  helpers.validateSide(payload.side);
  dateUtils.validateDate(
    entryPayload.createdAt,
    journalLineError.InvalidCreatedAt
  );

  const functionalAmount = moneyValue.convert(
    payload.amount,
    numberUtils.toFactor(
      payload.exchangeRate?.rate ?? 1,
      journalLineError.InvalidExchangeRate
    ),
    payload.functionalCurrency
  );
  const description = helpers.getDescription(
    payload.description ?? entryPayload.memo
  );

  const lineItem: IJournalLine = {
    id: generateUUID(),
    entryId: entryPayload.id,
    accountId: payload.accountId,
    sequenceOrder: payload.sequenceOrder,
    amount: payload.amount,
    exchangeRate: payload.exchangeRate,
    functionalAmount,
    side: payload.side,
    description,
    meta: null, // TODO: add meta when needed
    version: 1,
    createdAt: entryPayload.createdAt,
    updatedAt: entryPayload.createdAt,
  };

  const event = journalLineEvents.created(lineItem);
  const audit = journalLineAudit.make({
    before: null,
    after: lineItem,
    action: EJournalLineAuditAction.Created,
  });

  return [Object.freeze(lineItem), [event], audit];
}

const journalLineEntity = Object.freeze({
  make,

  ...helpers,
});

export default journalLineEntity;
