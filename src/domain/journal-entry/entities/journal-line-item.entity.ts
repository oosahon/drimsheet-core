import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import moneyValue from '../../../shared/value-objects/money.vo';
import { ICurrency } from '../../currency/types/currency.types';
import journalLineItemEvents from '../events/journal-line-item.events';
import {
  EEJournalEntrySide,
  IJournalEntry,
  IJournalLineItem,
  UJournalEntrySide,
} from '../types/journal-entry.types';

function validateSide(side: UJournalEntrySide) {
  if (!Object.values(EEJournalEntrySide).includes(side)) {
    throw new AppError('Invalid side', { cause: side });
  }
}

function getDescription(value: string) {
  return stringUtils.sanitizeAndValidate(value, {
    max: 100,
    min: 1,
  });
}

function make(
  entryPayload: Pick<IJournalEntry, 'id' | 'memo' | 'createdAt'>,
  payload: TCreationOmits<
    IJournalLineItem,
    'id' | 'functionalAmount' | 'version' | 'entryId'
  >,
  functionalCurrency: ICurrency
): TEntityWithEvents<IJournalLineItem, IJournalLineItem> {
  stringUtils.validateUUID(entryPayload.id);
  stringUtils.validateUUID(payload.accountId);
  numberUtils.validateInteger(payload.sequenceOrder);
  moneyValue.validate(payload.amount);
  validateSide(payload.side);
  dateUtils.validateDate(entryPayload.createdAt);

  const functionalAmount = moneyValue.convert(
    payload.amount,
    numberUtils.toFactor(payload.exchangeRate),
    functionalCurrency
  );
  const description = getDescription(payload.description ?? entryPayload.memo);

  const lineItem: IJournalLineItem = {
    id: generateUUID(),
    entryId: entryPayload.id,
    accountId: payload.accountId,
    sequenceOrder: payload.sequenceOrder,
    amount: payload.amount,
    exchangeRate: numberUtils.toFloat(payload.exchangeRate),
    functionalAmount,
    side: payload.side,
    description,
    meta: undefined, // TODO: add meta when needed
    version: 1,
    createdAt: entryPayload.createdAt,
    updatedAt: entryPayload.createdAt,
  };

  const event = journalLineItemEvents.created(lineItem);

  return [Object.freeze(lineItem), [event]];
}

const journalLineItemEntity = Object.freeze({
  make,

  validateSide,
  getDescription,
});

export default journalLineItemEntity;
