import eventValue from '../../../../shared/value-objects/event.vo';
import { ILedgerAccount } from '../types/ledger.types';

export const ELedgerAccountEvent = {
  Created: 'domain:ledger:account:created',
} as const;

export type ULedgerAccountEvent =
  (typeof ELedgerAccountEvent)[keyof typeof ELedgerAccountEvent];

function makeLedgerAccountCreatedEvent<T extends ILedgerAccount>(payload: T) {
  return eventValue.make<T>({
    type: ELedgerAccountEvent.Created,
    data: payload,
  });
}

const ledgerAccountEvents = Object.freeze({
  makeCreated: makeLedgerAccountCreatedEvent,
});

export default ledgerAccountEvents;
