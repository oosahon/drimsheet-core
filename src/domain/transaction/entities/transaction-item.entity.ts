import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import transactionItemEvents from '../events/transaction-item.events';
import { ITransactionItem, UTransactionType } from '../types/transaction.types';

export type TMakeTransactionItemPayload = TCreationOmits<
  ITransactionItem,
  'transactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

function make(
  transactionId: TEntityId,
  transactionType: UTransactionType,
  transactionCreatedAt: Date,
  payload: TMakeTransactionItemPayload
): TEntityWithEvents<ITransactionItem, ITransactionItem> {
  stringUtils.validateUUID(transactionId);
  stringUtils.validateUUID(payload.accountId);
  stringUtils.validateUUID(payload.categoryId);

  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalCurrencyAmount);

  const item: ITransactionItem = Object.freeze({
    id: generateUUID(),
    description: payload.description,
    amount: payload.amount,
    functionalCurrencyAmount: payload.functionalCurrencyAmount,
    transactionId: transactionId,
    categoryId: payload.categoryId,
    accountId: payload.accountId,
    createdAt: transactionCreatedAt,
    updatedAt: transactionCreatedAt,
    deletedAt: null,
  });

  const event = transactionItemEvents.created(item, transactionType);

  return [item, [event]];
}

const transactionItemEntity = Object.freeze({
  make,
});

export default transactionItemEntity;
