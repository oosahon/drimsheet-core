import eventValue from '../../../../shared/values/events/event.vo';
import {
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IGiftsAccount,
  IGrantsAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from '../types/revenue-account.types';

export const ERevenueLedgerEvent = {
  ServicesCreated: 'domain:ledger:revenue:account:services:created',
  EmploymentIncomeCreated:
    'domain:ledger:revenue:account:employment-income:created',
  GainOnAssetSaleCreated: 'domain:ledger:revenue:account:gain-on-sale:created',
  UnrealizedGainsCreated:
    'domain:ledger:revenue:account:unrealized-gains:created',
  GrantsCreated: 'domain:ledger:revenue:account:grants:created',
  GiftsCreated: 'domain:ledger:revenue:account:gifts:created',
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

function makeGainOnAssetSaleAccountCreatedEvent(
  payload: IGainOnAssetSaleAccount
) {
  return eventValue.make<IGainOnAssetSaleAccount>({
    type: ERevenueLedgerEvent.GainOnAssetSaleCreated,
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

function makeGrantsAccountCreatedEvent(payload: IGrantsAccount) {
  return eventValue.make<IGrantsAccount>({
    type: ERevenueLedgerEvent.GrantsCreated,
    data: payload,
  });
}

function makeGiftsAccountCreatedEvent(payload: IGiftsAccount) {
  return eventValue.make<IGiftsAccount>({
    type: ERevenueLedgerEvent.GiftsCreated,
    data: payload,
  });
}

const revenueAccountEvents = Object.freeze({
  servicesCreated: makeServicesAccountCreatedEvent,
  employmentIncomeCreated: makeEmploymentIncomeAccountCreatedEvent,
  GainOnAssetSaleCreated: makeGainOnAssetSaleAccountCreatedEvent,
  unrealizedGainsCreated: makeUnrealizedGainsAccountCreatedEvent,
  grantsCreated: makeGrantsAccountCreatedEvent,
  giftsCreated: makeGiftsAccountCreatedEvent,
});

export default revenueAccountEvents;
