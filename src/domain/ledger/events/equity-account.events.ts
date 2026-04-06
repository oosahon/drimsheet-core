import eventValue from '../../../shared/value-objects/event.vo';
import {
  IRetainedEarningsAccount,
  IOpeningBalanceEquityAccount,
} from '../types/equity-account.types';

export const EEquityLedgerEvent = {
  RetainedEarningsCreated:
    'domain:ledger:equity:account:retained-earnings:created',
  OpeningBalanceEquityCreated:
    'domain:ledger:equity:account:opening-balance-equity:created',
} as const;

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
