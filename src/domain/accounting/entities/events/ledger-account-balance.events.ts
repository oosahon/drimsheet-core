import eventValue from '../../../../shared/value-objects/event.vo';
import { INewLedgerAccountBalanceAndAdjustment } from '../../types/ledger-account-balance.types';

export const ELedgerAccountBalanceEvents = {
  Adjusted: 'domain:accounting:ledger-account-balance:adjusted',
} as const;

export const ledgerAccountBalanceEventDescriptions = {
  [ELedgerAccountBalanceEvents.Adjusted]: 'Updated account balance.',
} as const;

function makeAdjustedEvent(payload: INewLedgerAccountBalanceAndAdjustment) {
  return eventValue.make<INewLedgerAccountBalanceAndAdjustment>({
    type: ELedgerAccountBalanceEvents.Adjusted,
    data: payload,
  });
}

const ledgerAccountBalanceEvents = Object.freeze({
  makeAdjusted: makeAdjustedEvent,
});

export default ledgerAccountBalanceEvents;
