import eventValue from '../../../shared/value-objects/event.vo';
import {
  IAssetDisposalLossAccount,
  IBankChargeAccount,
  IDirectCostsAccount,
  IFinanceCostAccount,
  IIncomeTaxExpenseAccount,
  IInterestAccount,
  IRentUtilitiesAccount,
  IUnrealizedLossAccount,
} from '../types/expense-account.types';

export const EExpenseLedgerEvent = {
  DirectCostsCreated: 'domain:ledger:expense:account:direct-costs:created',
  RentAndUtilitiesCreated:
    'domain:ledger:expense:account:rent-and-utilities:created',
  BankChargeCreated: 'domain:ledger:expense:account:bank-charge:created',
  FinanceCostCreated: 'domain:ledger:expense:account:finance-cost:created',
  InterestCreated: 'domain:ledger:expense:account:interest:created',
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

function makeBankChargeAccountCreatedEvent(payload: IBankChargeAccount) {
  return eventValue.make<IBankChargeAccount>({
    type: EExpenseLedgerEvent.BankChargeCreated,
    data: payload,
  });
}

function makeFinanceCostAccountCreatedEvent(payload: IFinanceCostAccount) {
  return eventValue.make<IFinanceCostAccount>({
    type: EExpenseLedgerEvent.FinanceCostCreated,
    data: payload,
  });
}

function makeInterestAccountCreatedEvent(payload: IInterestAccount) {
  return eventValue.make<IInterestAccount>({
    type: EExpenseLedgerEvent.InterestCreated,
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
  bankChargeCreated: makeBankChargeAccountCreatedEvent,
  financeCostCreated: makeFinanceCostAccountCreatedEvent,
  interestCreated: makeInterestAccountCreatedEvent,
  taxExpenseCreated: makeTaxExpenseAccountCreatedEvent,
  unrealizedLossCreated: makeUnrealizedLossAccountCreatedEvent,
  assetDisposalLossCreated: makeAssetDisposalLossAccountCreatedEvent,
});

export default expenseAccountEvents;
