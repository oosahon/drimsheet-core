import { IEvent } from '../../../shared/types/event.types';
import eventValue from '../../../shared/value-objects/event.vo';
import {
  ITransactionLineItem,
  UTransactionType,
} from '../types/transaction.types';

export const ETransactionItemEvent = {
  TransactionItemCreated: 'domain:transaction:item:created',
} as const;

export const transactionLineItemEventDescriptions: Record<string, string> = {
  [ETransactionItemEvent.TransactionItemCreated]:
    'Created a new transaction item.',
};

function makeTransactionItemCreatedEvent(
  payload: ITransactionLineItem,
  transactionType: UTransactionType
): Readonly<IEvent<ITransactionLineItem>> {
  return eventValue.make<ITransactionLineItem>({
    type: `domain:transaction:${transactionType}:item:created`,
    data: payload,
  });
}

const transactionLineItemEvents = Object.freeze({
  created: makeTransactionItemCreatedEvent,
});

export default transactionLineItemEvents;
