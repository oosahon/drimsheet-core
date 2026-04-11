import { TEntityWithEvents } from '../../../../shared/types/event.types';
import revenueAccountEvents from '../../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IGainOnAssetSaleAccount,
} from '../../types/revenue-account.types';
import { TGainOnAssetSaleLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TGainOnAssetSaleLedgerCode
): TGainOnAssetSaleLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TGainOnAssetSaleLedgerCode>(
    '405',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IGainOnAssetSaleAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TGainOnAssetSaleLedgerCode | null
): TEntityWithEvents<IGainOnAssetSaleAccount, IGainOnAssetSaleAccount> {
  const account = ledgerAccountEntity.make<IGainOnAssetSaleAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '405000',
    type: ELedgerType.Revenue,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    subType: ERevenueSubType.GainOnAssetSale,
    behavior: ERevenueAccountBehavior.GainOnAssetSale,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.GainOnAssetSaleCreated(account);
  return [account, [event]];
}

const GainOnAssetSaleAccountEntity = Object.freeze({
  make,
  getCode,
});

export default GainOnAssetSaleAccountEntity;
