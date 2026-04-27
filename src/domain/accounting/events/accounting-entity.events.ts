import eventValue from '../../../shared/value-objects/event.vo';
import { IAccountingEntity } from '../types/accounting-entity.types';

export const EAccountingEntityEvents = {
  Created: 'domain:accounting:entity:created',
  BootstrapIndividualPostingAccounts:
    'domain:accounting:entity:individual:bootstrap-posting-accounts',
} as const;

export const accountingEntityEventDescriptions: Record<string, string> = {
  [EAccountingEntityEvents.Created]: 'Created an accounting entity.',
  [EAccountingEntityEvents.BootstrapIndividualPostingAccounts]:
    'Bootstrapped individual posting accounts.',
};

function makeCreatedEvent(params: IAccountingEntity) {
  return eventValue.make<IAccountingEntity>({
    type: EAccountingEntityEvents.Created,
    data: params,
  });
}

function makeBootstrapIndividualPostingAccountsEvent(
  params: IAccountingEntity
) {
  return eventValue.make<IAccountingEntity>({
    type: EAccountingEntityEvents.BootstrapIndividualPostingAccounts,
    data: params,
  });
}

const accountingEntityEvents = Object.freeze({
  created: makeCreatedEvent,
  bootstrapIndividualPostingAccounts:
    makeBootstrapIndividualPostingAccountsEvent,
});

export default accountingEntityEvents;
