import { IEvent } from '../../../shared/types/event.types';
import eventValue from '../../../shared/value-objects/event.vo';
import { ITransactionItem, UTransactionType } from '../types/transaction.types';

export const ETransactionItemEvent = {
  TransactionItemCreated: 'domain:transaction:item:created',
} as const;

export const transactionItemEventDescriptions: Record<string, string> = {
  [ETransactionItemEvent.TransactionItemCreated]:
    'Created a new transaction item.',
};

function makeTransactionItemCreatedEvent(
  payload: ITransactionItem,
  transactionType: UTransactionType
): Readonly<IEvent<ITransactionItem>> {
  return eventValue.make<ITransactionItem>({
    type: `domain:transaction:${transactionType}:item:created`,
    data: payload,
  });
}

const transactionItemEvents = Object.freeze({
  created: makeTransactionItemCreatedEvent,
});

export default transactionItemEvents;
