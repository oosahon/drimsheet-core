import { IEvent } from '../../../shared/types/event.types';
import eventValue from '../../../shared/value-objects/event.vo';
import { ITransactionLine } from '../types/transaction.types';

export const ETransactionLineEvent = {
  TransactionLineCreated: 'domain:transaction:line:created',
} as const;

export const transactionLineEventDescriptions: Record<string, string> = {
  [ETransactionLineEvent.TransactionLineCreated]:
    'Created a new transaction line.',
};

function makeTransactionLineCreatedEvent(
  payload: ITransactionLine
): Readonly<IEvent<ITransactionLine>> {
  return eventValue.make<ITransactionLine>({
    type: ETransactionLineEvent.TransactionLineCreated,
    data: payload,
  });
}

const transactionLineEvents = Object.freeze({
  created: makeTransactionLineCreatedEvent,
});

export default transactionLineEvents;
