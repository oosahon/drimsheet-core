import { TEntityWithEvents } from '../../../../shared/types/event.types';
import revenueAccountEvents from '../../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IServicesAccount,
} from '../../types/revenue-account.types';
import { TServicesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(predecessorCode: TServicesLedgerCode): TServicesLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TServicesLedgerCode>(
    '401',
    predecessorCode
  );
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
  predecessorCode: TServicesLedgerCode | null
): TEntityWithEvents<IServicesAccount, IServicesAccount> {
  const account = ledgerAccountEntity.make<IServicesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '401000',
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
  return [account, [event]];
}

const servicesAccountEntity = Object.freeze({
  make,
  getCode,
});

export default servicesAccountEntity;
