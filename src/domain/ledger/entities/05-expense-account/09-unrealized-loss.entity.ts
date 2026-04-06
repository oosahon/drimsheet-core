import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IUnrealizedLossAccount,
} from '../../types/expense-account.types';
import { TUnrealizedLossLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TUnrealizedLossLedgerCode
): TUnrealizedLossLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TUnrealizedLossLedgerCode>(
    '509',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IUnrealizedLossAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TUnrealizedLossLedgerCode | null
): TEntityWithEvents<IUnrealizedLossAccount, IUnrealizedLossAccount> {
  const account = ledgerAccountEntity.make<IUnrealizedLossAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '509000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.UnrealizedLoss,
    behavior: EExpenseAccountBehavior.UnrealizedLoss,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.unrealizedLossCreated(account);
  return [account, [event]];
}

const unrealizedLossAccountEntity = Object.freeze({
  make,
  getCode,
});

export default unrealizedLossAccountEntity;
