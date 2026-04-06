import eventValue from '../../../shared/value-objects/event.vo';
import {
  IRentUtilitiesAccount,
  IDirectCostsAccount,
  IInterestFinanceAccount,
  IIncomeTaxExpenseAccount,
  IUnrealizedLossAccount,
  IAssetDisposalLossAccount,
} from '../types/expense-account.types';

export const EExpenseLedgerEvent = {
  DirectCostsCreated: 'domain:ledger:expense:account:direct-costs:created',
  RentAndUtilitiesCreated:
    'domain:ledger:expense:account:rent-and-utilities:created',
  FinanceCostsCreated: 'domain:ledger:expense:account:finance-costs:created',
  TaxExpenseCreated: 'domain:ledger:expense:account:tax-expense:created',
  UnrealizedLossCreated:
    'domain:ledger:expense:account:unrealized-loss:created',
  AssetDisposalLossCreated:
    'domain:ledger:expense:account:asset-disposal-loss:created',
} as const;

function makeDirectCostsAccountCreatedEvent(payload: IDirectCostsAccount) {
  return eventValue.make<IDirectCostsAccount>({
    type: EExpenseLedgerEvent.DirectCostsCreated,
    data: payload,
  });
}

function makeRentAndUtilitiesAccountCreatedEvent(
  payload: IRentUtilitiesAccount
) {
  return eventValue.make<IRentUtilitiesAccount>({
    type: EExpenseLedgerEvent.RentAndUtilitiesCreated,
    data: payload,
  });
}

function makeFinanceCostsAccountCreatedEvent(payload: IInterestFinanceAccount) {
  return eventValue.make<IInterestFinanceAccount>({
    type: EExpenseLedgerEvent.FinanceCostsCreated,
    data: payload,
  });
}

function makeTaxExpenseAccountCreatedEvent(payload: IIncomeTaxExpenseAccount) {
  return eventValue.make<IIncomeTaxExpenseAccount>({
    type: EExpenseLedgerEvent.TaxExpenseCreated,
    data: payload,
  });
}

function makeUnrealizedLossAccountCreatedEvent(
  payload: IUnrealizedLossAccount
) {
  return eventValue.make<IUnrealizedLossAccount>({
    type: EExpenseLedgerEvent.UnrealizedLossCreated,
    data: payload,
  });
}

function makeAssetDisposalLossAccountCreatedEvent(
  payload: IAssetDisposalLossAccount
) {
  return eventValue.make<IAssetDisposalLossAccount>({
    type: EExpenseLedgerEvent.AssetDisposalLossCreated,
    data: payload,
  });
}

const expenseAccountEvents = Object.freeze({
  directCostsCreated: makeDirectCostsAccountCreatedEvent,
  rentAndUtilitiesCreated: makeRentAndUtilitiesAccountCreatedEvent,
  financeCostsCreated: makeFinanceCostsAccountCreatedEvent,
  taxExpenseCreated: makeTaxExpenseAccountCreatedEvent,
  unrealizedLossCreated: makeUnrealizedLossAccountCreatedEvent,
  assetDisposalLossCreated: makeAssetDisposalLossAccountCreatedEvent,
});

export default expenseAccountEvents;
