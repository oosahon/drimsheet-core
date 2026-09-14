import dateUtils from '@shared/utils/date';
import numberUtils from '@shared/utils/number';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import { IEvent } from '@shared/values/events/types/event.types';

import helpers from '@domain/journal-entry/entities/helpers/journal-line.helpers';
import journalLineError from '@domain/journal-entry/errors/journal-line.error';
import journalLineEvents from '@domain/journal-entry/events/journal-line-item.events';
import {
  EJournalLineAuditAction,
  IJournalLineAudit,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';
import {
  IJournalLine,
  IJournalLineMakePayload,
} from '@domain/journal-entry/types/journal-line.types';
import journalLineAudit from '@domain/journal-entry/values/journal-line-audit.vo';
import moneyValue from '@domain/money/values/money.vo';

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
  helpers.validateCounterpartyId(payload.counterpartyId ?? null);
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

  const functionalAmount = payload.exchangeRate
    ? moneyValue.convert(
        payload.amount,
        payload.exchangeRate,
        payload.functionalCurrency
      )
    : payload.amount;
  const description = helpers.getDescription(
    payload.description ?? entryPayload.memo
  );

  const lineItem: IJournalLine = {
    id: generateUUID(),
    entryId: entryPayload.id,
    accountId: payload.accountId,
    counterpartyId: payload.counterpartyId ?? null,
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
