import eventValue from '../../../shared/value-objects/event.vo';
import {
  ILiabilitySuspenseAccount,
  IShortTermDebtAccount,
  IPayableAccount,
} from '../types/liability-account.types';

export const ELiabilityLedgerEvent = {
  SuspenseCreated: 'domain:ledger:liability:account:suspense:created',
  ShortTermLoanCreated:
    'domain:ledger:liability:account:short-term-loan:created',
  PayableCreated: 'domain:ledger:liability:account:payable:created',
} as const;

function makeSuspenseAccountCreatedEvent(payload: ILiabilitySuspenseAccount) {
  return eventValue.make<ILiabilitySuspenseAccount>({
    type: ELiabilityLedgerEvent.SuspenseCreated,
    data: payload,
  });
}

function makeShortTermLoanCreatedEvent(payload: IShortTermDebtAccount) {
  return eventValue.make<IShortTermDebtAccount>({
    type: ELiabilityLedgerEvent.ShortTermLoanCreated,
    data: payload,
  });
}

function makePayableCreatedEvent(payload: IPayableAccount) {
  return eventValue.make<IPayableAccount>({
    type: ELiabilityLedgerEvent.PayableCreated,
    data: payload,
  });
}

const liabilityAccountEvents = Object.freeze({
  suspenseCreated: makeSuspenseAccountCreatedEvent,
  shortTermLoanCreated: makeShortTermLoanCreatedEvent,
  payableCreated: makePayableCreatedEvent,
});

export default liabilityAccountEvents;
