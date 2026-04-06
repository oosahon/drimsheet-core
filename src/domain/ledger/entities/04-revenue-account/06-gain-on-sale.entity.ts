import { TEntityWithEvents } from '../../../../shared/types/event.types';
import revenueAccountEvents from '../../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IGainOnSaleAccount,
} from '../../types/revenue-account.types';
import { TGainOnSaleLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TGainOnSaleLedgerCode
): TGainOnSaleLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TGainOnSaleLedgerCode>(
    '405',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IGainOnSaleAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TGainOnSaleLedgerCode | null
): TEntityWithEvents<IGainOnSaleAccount, IGainOnSaleAccount> {
  const account = ledgerAccountEntity.make<IGainOnSaleAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '405000',
    type: ELedgerType.Revenue,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    subType: ERevenueSubType.GainOnSale,
    behavior: ERevenueAccountBehavior.GainOnSale,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.gainOnSaleCreated(account);
  return [account, [event]];
}

const gainOnSaleAccountEntity = Object.freeze({
  make,
  getCode,
});

export default gainOnSaleAccountEntity;
