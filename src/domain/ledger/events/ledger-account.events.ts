import eventValue from '../../../shared/values/events/event.vo';
import { ILedgerAccount } from '../types/ledger.types';

export const ELedgerAccountEvent = {
  Created: 'domain:ledger:account:created',
  Updated: 'domain:ledger:account:updated',
} as const;

export type ULedgerAccountEvent =
  (typeof ELedgerAccountEvent)[keyof typeof ELedgerAccountEvent];

function makeLedgerAccountCreatedEvent<T extends ILedgerAccount>(payload: T) {
  return eventValue.make<T>({
    type: ELedgerAccountEvent.Created,
    data: payload,
  });
}

function makeLedgerAccountUpdatedEvent<T extends ILedgerAccount>(payload: T) {
  return eventValue.make<T>({
    type: ELedgerAccountEvent.Updated,
    data: payload,
  });
}

const ledgerAccountEvents = Object.freeze({
  makeCreated: makeLedgerAccountCreatedEvent,
  updated: makeLedgerAccountUpdatedEvent,
});

export default ledgerAccountEvents;
