import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import { ICurrency } from '../../currency/types/currency.types';
import journalLineItemEvents from '../events/journal-line-item.events';
import { IJournalEntry } from '../types/journal-entry.types';
import { IJournalLineItem } from '../types/journal-line-item.types';
import helpers from './helpers/journal-line-item.helpers';

export interface IMakePayload extends Pick<
  IJournalLineItem,
  'accountId' | 'sequenceOrder' | 'amount' | 'exchangeRate' | 'side'
> {
  functionalCurrency: ICurrency;
  description?: string;
}

function make(
  entryPayload: Pick<IJournalEntry, 'id' | 'memo' | 'createdAt'>,
  payload: IMakePayload
): TEntityWithEvents<IJournalLineItem, IJournalLineItem> {
  stringUtils.validateUUID(entryPayload.id);
  stringUtils.validateUUID(payload.accountId);
  numberUtils.validateInteger(payload.sequenceOrder);
  moneyValue.validate(payload.amount);

  helpers.validateExchangeRate(payload);
  helpers.validateSide(payload.side);
  dateUtils.validateDate(entryPayload.createdAt);

  const functionalAmount = moneyValue.convert(
    payload.amount,
    numberUtils.toFactor(payload.exchangeRate?.rate ?? 1),
    payload.functionalCurrency
  );
  const description = helpers.getDescription(
    payload.description ?? entryPayload.memo
  );

  const lineItem: IJournalLineItem = {
    id: generateUUID(),
    entryId: entryPayload.id,
    accountId: payload.accountId,
    sequenceOrder: payload.sequenceOrder,
    amount: payload.amount,
    exchangeRate: payload.exchangeRate,
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

  ...helpers,
});

export default journalLineItemEntity;
