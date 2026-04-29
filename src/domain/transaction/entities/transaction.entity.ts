import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import getEntitiesAndEvents from '../../../shared/utils/get-entities-and-events';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import { ICurrency } from '../../currency/types/currency.types';
import exchangeRateValue from '../../currency/value-objects/exchange-rate.vo';
import transactionEvents from '../events/transaction.events';
import { ITransaction, ITransactionLine } from '../types/transaction.types';
import helpers from './helpers/transaction.entity.helpers';
import transactionLineEntity, {
  TMakeTransactionLineItemPayload,
} from './transaction-line.entity';

interface IMakePayload extends Pick<
  ITransaction,
  | 'accountingEntityId'
  | 'type'
  | 'status'
  | 'effectiveDate'
  | 'createdBy'
  | 'sourceAccountId'
  | 'attachments'
  | 'notes'
  | 'exchangeRate'
> {
  functionalCurrency: ICurrency;
  reference?: string;
}

function getReference(reference?: string) {
  if (reference) {
    return stringUtils
      .sanitizeAndValidate(reference, { min: 3, max: 100 })
      .toUpperCase();
  }
  return helpers.generateReference();
}

function make(
  payload: IMakePayload,
  itemsPayload: TMakeTransactionLineItemPayload[]
): TEntityWithEvents<ITransaction, ITransaction | ITransactionLine> {
  stringUtils.validateUUID(payload.accountingEntityId);
  helpers.validateType(payload.type);
  helpers.validateStatus(payload.status);
  dateUtils.validateDate(payload.effectiveDate);
  stringUtils.validateUUID(payload.createdBy);
  stringUtils.validateUUID(payload.sourceAccountId);
  helpers.validateAttachments(payload.attachments);
  helpers.validateItemsPayload(itemsPayload);
  exchangeRateValue.validate(payload.exchangeRate);

  const id = generateUUID();
  const timestamp = new Date();

  const itemsWithEvents = itemsPayload.map((item) => {
    return transactionLineEntity.make(
      { id, type: payload.type, createdAt: timestamp },
      item
    );
  });

  const { entities: items, events: itemsEvents } =
    getEntitiesAndEvents(itemsWithEvents);

  const amount = moneyValue.add(...items.map((i) => i.amount));
  const exchangeRate = numberUtils.toFloat(payload.exchangeRate.rate);
  const functionalAmount = moneyValue.convert(
    amount,
    numberUtils.toFactor(exchangeRate),
    payload.functionalCurrency
  );
  const notes = helpers.sanitizeAndValidateNotes(payload.notes);

  const transaction: ITransaction = {
    id,
    accountingEntityId: payload.accountingEntityId,
    reference: getReference(payload.reference),
    type: payload.type,
    status: payload.status,
    items,
    effectiveDate: payload.effectiveDate,
    createdBy: payload.createdBy,
    sourceAccountId: payload.sourceAccountId,
    amount,
    exchangeRate: payload.exchangeRate,
    functionalAmount,
    attachments: payload.attachments,
    notes,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const events = [transactionEvents.created(transaction), ...itemsEvents];

  return [Object.freeze(transaction), events];
}

const transactionEntity = Object.freeze({
  make,

  ...helpers,
});

export default transactionEntity;
