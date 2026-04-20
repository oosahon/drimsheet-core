import eventValue from '../../../shared/value-objects/event.vo';
import { ITransaction } from '../types/transaction.types';

export const ETransactionEvent = {
  Created: 'domain:transaction:created',
} as const;

export type UTransactionEvent =
  (typeof ETransactionEvent)[keyof typeof ETransactionEvent];

export const transactionEventDescriptions: Record<string, string> = {
  [ETransactionEvent.Created]: 'Created a new transaction.',
};

function makeTransactionCreatedEvent(payload: ITransaction) {
  return eventValue.make<ITransaction>({
    type: ETransactionEvent.Created,
    data: payload,
  });
}

const transactionEvents = Object.freeze({
  created: makeTransactionCreatedEvent,
});

export default transactionEvents;
