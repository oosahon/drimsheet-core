import eventValue from '../../../shared/value-objects/event.vo';
import { ITransaction } from '../types/transaction.types';

export const ETransactionEvent = {
  TransactionCreated: 'domain:transaction:created',
} as const;

export const transactionEventDescriptions: Record<string, string> = {
  [ETransactionEvent.TransactionCreated]: 'Created a new transaction.',
};

function makeTransactionCreatedEvent(payload: ITransaction) {
  return eventValue.make<ITransaction>({
    type: ETransactionEvent.TransactionCreated,
    data: payload,
  });
}

const transactionEvents = Object.freeze({
  created: makeTransactionCreatedEvent,
});

export default transactionEvents;
