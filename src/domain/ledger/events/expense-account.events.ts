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

export const expenseAccountEventDescriptions: Record<string, string> = {
  [EExpenseLedgerEvent.DirectCostsCreated]:
    'Created a direct costs expense account.',
  [EExpenseLedgerEvent.RentAndUtilitiesCreated]:
    'Created a rent and utilities expense account.',
  [EExpenseLedgerEvent.FinanceCostsCreated]:
    'Created a finance costs expense account.',
  [EExpenseLedgerEvent.TaxExpenseCreated]: 'Created a tax expense account.',
  [EExpenseLedgerEvent.UnrealizedLossCreated]:
    'Created an unrealized loss expense account.',
  [EExpenseLedgerEvent.AssetDisposalLossCreated]:
    'Created an asset disposal loss expense account.',
};

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
