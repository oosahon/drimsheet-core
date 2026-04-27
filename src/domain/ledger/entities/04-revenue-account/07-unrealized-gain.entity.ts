import { TEntityWithEvents } from '../../../../shared/types/event.types';
import ledgerAccountEvents from '../../events/ledger-account.events';
import revenueAccountEvents from '../../events/revenue-account.events';
import { TUnrealizedGainLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IUnrealizedGainAccount,
} from '../../types/revenue-account.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/unrealized-gain.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TUnrealizedGainLedgerCode;
  precedingCode: TUnrealizedGainLedgerCode;
}

function make(
  payload: Pick<
    IUnrealizedGainAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'accountingContextId'
    | 'accountingContextId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IUnrealizedGainAccount, IUnrealizedGainAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IUnrealizedGainAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    accountingContextId: payload.accountingContextId,
    code,
    materializedPath,
    type: ELedgerType.Revenue,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    subType: ERevenueSubType.UnrealizedGains,
    behavior: ERevenueAccountBehavior.UnrealizedGains,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.unrealizedGainsCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const unrealizedGainAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default unrealizedGainAccountEntity;
