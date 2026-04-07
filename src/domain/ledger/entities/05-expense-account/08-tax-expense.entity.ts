import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IIncomeTaxExpenseAccount,
} from '../../types/expense-account.types';
import { TIncomeTaxLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(predecessorCode: TIncomeTaxLedgerCode): TIncomeTaxLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TIncomeTaxLedgerCode>(
    '508',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IIncomeTaxExpenseAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TIncomeTaxLedgerCode | null
): TEntityWithEvents<IIncomeTaxExpenseAccount, IIncomeTaxExpenseAccount> {
  const account = ledgerAccountEntity.make<IIncomeTaxExpenseAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '508000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.IncomeTaxExpense,
    behavior: EExpenseAccountBehavior.TaxExpense,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.taxExpenseCreated(account);
  return [account, [event]];
}

const taxExpenseAccountEntity = Object.freeze({
  make,
  getCode,
});

export default taxExpenseAccountEntity;
