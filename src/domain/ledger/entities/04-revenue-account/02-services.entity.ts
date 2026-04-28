import { TEntityWithEvents } from '../../../../shared/types/event.types';
import ledgerAccountEvents from '../../events/ledger-account.events';
import revenueAccountEvents from '../../events/revenue-account.events';
import { TServicesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IServicesAccount,
} from '../../types/revenue-account.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/services.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TServicesLedgerCode;
  precedingCode: TServicesLedgerCode;
}

function make(
  payload: Pick<
    IServicesAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IServicesAccount, IServicesAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IServicesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.Services,
    behavior: ERevenueAccountBehavior.Services,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.servicesCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const servicesAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default servicesAccountEntity;
