import eventValue from '../../../shared/value-objects/event.vo';
import { ITransaction } from '../types/transaction.types';

export const ETransactionEvent = {
  TransactionCreated: 'domain:transaction:created',
  TransactionUpdated: 'domain:transaction:updated',
} as const;

export const transactionEventDescriptions: Record<string, string> = {
  [ETransactionEvent.TransactionCreated]: 'Created a new transaction.',
  [ETransactionEvent.TransactionUpdated]: 'Updated an existing transaction.',
};

function makeTransactionCreatedEvent(payload: ITransaction) {
  return eventValue.make<ITransaction>({
    type: ETransactionEvent.TransactionCreated,
    data: payload,
  });
}

function makeTransactionUpdatedEvent(payload: ITransaction) {
  return eventValue.make<ITransaction>({
    type: ETransactionEvent.TransactionUpdated,
    data: payload,
  });
}

const transactionEvents = Object.freeze({
  created: makeTransactionCreatedEvent,
  updated: makeTransactionUpdatedEvent,
});

export default transactionEvents;
