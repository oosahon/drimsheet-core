import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import moneyValue from '../../../shared/value-objects/money.vo';
import transactionLineItemEvents from '../events/transaction-item.events';
import {
  ETransactionType,
  ITransaction,
  ITransactionLineItem,
  UTransactionType,
} from '../types/transaction.types';

export type TMakeTransactionLineItemPayload = TCreationOmits<
  ITransactionLineItem,
  'transactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

type TTransactionDetails = Pick<ITransaction, 'id' | 'type' | 'createdAt'>;

function validateCounterpartyId(
  type: UTransactionType,
  counterPartyId: TEntityId | null
) {
  const isTransfer = type === ETransactionType.Transfer;

  if (isTransfer && counterPartyId) {
    throw new AppError('Counterparty ID is not allowed for transfers');
  }

  if (!counterPartyId) {
    throw new AppError('Counterparty ID is required.');
  }

  stringUtils.validateUUID(counterPartyId);
}

function make(
  transactionDetails: TTransactionDetails,
  payload: TMakeTransactionLineItemPayload
): TEntityWithEvents<ITransactionLineItem, ITransactionLineItem> {
  stringUtils.validateUUID(transactionDetails.id);
  stringUtils.validateUUID(payload.targetAccountId);
  validateCounterpartyId(transactionDetails.type, payload.counterPartyId);

  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalAmount);

  const item: ITransactionLineItem = Object.freeze({
    id: generateUUID(),
    description: payload.description,
    amount: payload.amount,
    functionalAmount: payload.functionalAmount,
    counterPartyId: payload.counterPartyId,
    transactionId: transactionDetails.id,
    targetAccountId: payload.targetAccountId,
    createdAt: transactionDetails.createdAt,
    updatedAt: transactionDetails.createdAt,
    deletedAt: null,
  });

  const event = transactionLineItemEvents.created(
    item,
    transactionDetails.type
  );

  return [item, [event]];
}

const transactionLineItemEntity = Object.freeze({
  make,
});

export default transactionLineItemEntity;
