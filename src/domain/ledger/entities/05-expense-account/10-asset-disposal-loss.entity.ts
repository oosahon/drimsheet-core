import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
} from '../../types/expense-account.types';
import { TAssetDisposalLossLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TAssetDisposalLossLedgerCode
): TAssetDisposalLossLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TAssetDisposalLossLedgerCode>(
    '510',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IAssetDisposalLossAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TAssetDisposalLossLedgerCode | null
): TEntityWithEvents<IAssetDisposalLossAccount, IAssetDisposalLossAccount> {
  const account = ledgerAccountEntity.make<IAssetDisposalLossAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '510000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.LossOnAssetDisposal,
    behavior: EExpenseAccountBehavior.AssetDisposalLoss,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.assetDisposalLossCreated(account);
  return [account, [event]];
}

const assetDisposalLossAccountEntity = Object.freeze({
  make,
  getCode,
});

export default assetDisposalLossAccountEntity;
