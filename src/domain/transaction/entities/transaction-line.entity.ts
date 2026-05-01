import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import transactionError from '../errors/transaction.error';
import transactionLineEvents from '../events/transaction-item.events';
import {
  ETransactionType,
  ITransaction,
  ITransactionLine,
  UTransactionType,
} from '../types/transaction.types';

export type TMakeTransactionLineItemPayload = TCreationOmits<
  ITransactionLine,
  'transactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

type TTransactionDetails = Pick<ITransaction, 'id' | 'type' | 'createdAt'>;

function validateCounterpartyId(
  type: UTransactionType,
  counterPartyId: TEntityId | null
) {
  const isTransfer = type === ETransactionType.Transfer;

  if (isTransfer) {
    if (counterPartyId) {
      throw new transactionError.CounterpartyIdNotAllowed();
    }
    return;
  }

  if (!counterPartyId) {
    throw new transactionError.MissingCounterpartyId();
  }

  stringUtils.validateUUID(counterPartyId);
}

function make(
  transactionDetails: TTransactionDetails,
  payload: TMakeTransactionLineItemPayload
): TEntityWithEvents<ITransactionLine, ITransactionLine> {
  stringUtils.validateUUID(transactionDetails.id);
  stringUtils.validateUUID(payload.targetAccountId);
  validateCounterpartyId(transactionDetails.type, payload.counterPartyId);

  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalAmount);

  const item: ITransactionLine = Object.freeze({
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

  const event = transactionLineEvents.created(item);

  return [item, [event]];
}

const transactionLineEntity = Object.freeze({
  make,
});

export default transactionLineEntity;
