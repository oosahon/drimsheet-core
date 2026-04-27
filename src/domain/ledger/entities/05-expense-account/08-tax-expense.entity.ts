import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
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
import helpers from './helpers/tax-expense.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TIncomeTaxLedgerCode;
  precedingCode: TIncomeTaxLedgerCode;
}

function make(
  payload: Pick<
    IIncomeTaxExpenseAccount,
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
): TEntityWithEvents<IIncomeTaxExpenseAccount, IIncomeTaxExpenseAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IIncomeTaxExpenseAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    accountingContextId: payload.accountingContextId,
    code,
    materializedPath,
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
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const taxExpenseAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default taxExpenseAccountEntity;
