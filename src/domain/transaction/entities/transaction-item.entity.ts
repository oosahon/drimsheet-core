import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import transactionItemEvents from '../events/transaction-item.events';
import { ITransaction, ITransactionItem } from '../types/transaction.types';

export type TMakeTransactionItemPayload = TCreationOmits<
  ITransactionItem,
  'transactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

type TTransactionDetails = Pick<ITransaction, 'id' | 'type' | 'createdAt'>;

function make(
  transactionDetails: TTransactionDetails,
  payload: TMakeTransactionItemPayload
): TEntityWithEvents<ITransactionItem, ITransactionItem> {
  stringUtils.validateUUID(transactionDetails.id);
  stringUtils.validateUUID(payload.accountId);
  stringUtils.validateUUID(payload.categoryId);

  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalCurrencyAmount);

  const item: ITransactionItem = Object.freeze({
    id: generateUUID(),
    description: payload.description,
    amount: payload.amount,
    functionalCurrencyAmount: payload.functionalCurrencyAmount,
    transactionId: transactionDetails.id,
    categoryId: payload.categoryId,
    accountId: payload.accountId,
    createdAt: transactionDetails.createdAt,
    updatedAt: transactionDetails.createdAt,
    deletedAt: null,
  });

  const event = transactionItemEvents.created(item, transactionDetails.type);

  return [item, [event]];
}

const transactionItemEntity = Object.freeze({
  make,
});

export default transactionItemEntity;
