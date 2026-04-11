import eventValue from '../../../shared/value-objects/event.vo';
import {
  IOpeningBalanceEquityAccount,
  IRetainedEarningsAccount,
} from '../types/equity-account.types';

export const EEquityLedgerEvent = {
  RetainedEarningsCreated:
    'domain:ledger:equity:account:retained-earnings:created',
  OpeningBalanceEquityCreated:
    'domain:ledger:equity:account:opening-balance-equity:created',
} as const;

export const equityAccountEventDescriptions: Record<string, string> = {
  [EEquityLedgerEvent.RetainedEarningsCreated]:
    'Created a retained earnings equity account.',
  [EEquityLedgerEvent.OpeningBalanceEquityCreated]:
    'Created an opening balance equity account.',
};

function makeRetainedEarningsCreatedEvent(payload: IRetainedEarningsAccount) {
  return eventValue.make<IRetainedEarningsAccount>({
    type: EEquityLedgerEvent.RetainedEarningsCreated,
    data: payload,
  });
}

function makeOpeningBalanceEquityCreatedEvent(
  payload: IOpeningBalanceEquityAccount
) {
  return eventValue.make<IOpeningBalanceEquityAccount>({
    type: EEquityLedgerEvent.OpeningBalanceEquityCreated,
    data: payload,
  });
}

const equityAccountEvents = Object.freeze({
  retainedEarningsCreated: makeRetainedEarningsCreatedEvent,
  openingBalanceEquityCreated: makeOpeningBalanceEquityCreatedEvent,
});

export default equityAccountEvents;
