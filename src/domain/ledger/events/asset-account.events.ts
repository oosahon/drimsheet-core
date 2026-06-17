import eventValue from '../../../shared/value-objects/event.vo';
import {
  IAssetSuspenseAccount,
  ICashAndCashEquivalentAccount,
  IReceivablesAccount,
} from '../types/asset-account.types';

export const EAssetLedgerEvent = {
  SuspenseCreated: 'domain:ledger:asset:account:suspense:created',
  CashAndEquivalentCreated:
    'domain:ledger:asset:account:cash-and-equivalent:created',
  ReceivablesCreated: 'domain:ledger:asset:account:receivables:created',
} as const;

function makeSuspenseAccountCreatedEvent(payload: IAssetSuspenseAccount) {
  return eventValue.make<IAssetSuspenseAccount>({
    type: EAssetLedgerEvent.SuspenseCreated,
    data: payload,
  });
}

function makeCashAndEquivalentCreatedEvent(
  payload: ICashAndCashEquivalentAccount
) {
  return eventValue.make<ICashAndCashEquivalentAccount>({
    type: EAssetLedgerEvent.CashAndEquivalentCreated,
    data: payload,
  });
}

function makeReceivablesCreatedEvent(payload: IReceivablesAccount) {
  return eventValue.make<IReceivablesAccount>({
    type: EAssetLedgerEvent.ReceivablesCreated,
    data: payload,
  });
}

const assetAccountEvents = Object.freeze({
  suspenseCreated: makeSuspenseAccountCreatedEvent,
  cashAndEquivalentCreated: makeCashAndEquivalentCreatedEvent,
  receivablesCreated: makeReceivablesCreatedEvent,
});

export default assetAccountEvents;
