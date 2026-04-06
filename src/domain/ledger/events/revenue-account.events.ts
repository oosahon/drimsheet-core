import eventValue from '../../../shared/value-objects/event.vo';
import {
  IEmploymentIncomeAccount,
  IGainOnSaleAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from '../types/revenue-account.types';

export const ERevenueLedgerEvent = {
  ServicesCreated: 'domain:ledger:revenue:account:services:created',
  EmploymentIncomeCreated:
    'domain:ledger:revenue:account:employment-income:created',
  GainOnSaleCreated: 'domain:ledger:revenue:account:gain-on-sale:created',
  UnrealizedGainsCreated:
    'domain:ledger:revenue:account:unrealized-gains:created',
} as const;

function makeServicesAccountCreatedEvent(payload: IServicesAccount) {
  return eventValue.make<IServicesAccount>({
    type: ERevenueLedgerEvent.ServicesCreated,
    data: payload,
  });
}

function makeEmploymentIncomeAccountCreatedEvent(
  payload: IEmploymentIncomeAccount
) {
  return eventValue.make<IEmploymentIncomeAccount>({
    type: ERevenueLedgerEvent.EmploymentIncomeCreated,
    data: payload,
  });
}

function makeGainOnSaleAccountCreatedEvent(payload: IGainOnSaleAccount) {
  return eventValue.make<IGainOnSaleAccount>({
    type: ERevenueLedgerEvent.GainOnSaleCreated,
    data: payload,
  });
}

function makeUnrealizedGainsAccountCreatedEvent(
  payload: IUnrealizedGainAccount
) {
  return eventValue.make<IUnrealizedGainAccount>({
    type: ERevenueLedgerEvent.UnrealizedGainsCreated,
    data: payload,
  });
}

const revenueAccountEvents = Object.freeze({
  servicesCreated: makeServicesAccountCreatedEvent,
  employmentIncomeCreated: makeEmploymentIncomeAccountCreatedEvent,
  gainOnSaleCreated: makeGainOnSaleAccountCreatedEvent,
  unrealizedGainsCreated: makeUnrealizedGainsAccountCreatedEvent,
});

export default revenueAccountEvents;
