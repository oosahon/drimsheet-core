import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IInterestFinanceAccount,
} from '../../types/expense-account.types';
import { TInterestFinanceLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TInterestFinanceLedgerCode
): TInterestFinanceLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TInterestFinanceLedgerCode>(
    '507',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IInterestFinanceAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TInterestFinanceLedgerCode | null
): TEntityWithEvents<IInterestFinanceAccount, IInterestFinanceAccount> {
  const account = ledgerAccountEntity.make<IInterestFinanceAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '507000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.InterestAndFinanceCharges,
    behavior: EExpenseAccountBehavior.FinanceCosts,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.financeCostsCreated(account);
  return [account, [event]];
}

const financeCostsAccountEntity = Object.freeze({
  make,
  getCode,
});

export default financeCostsAccountEntity;
