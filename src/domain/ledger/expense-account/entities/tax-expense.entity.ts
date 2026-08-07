import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import { TIncomeTaxLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import expenseAccountEvents from '../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IIncomeTaxExpenseAccount,
} from '../types/expense-account.types';
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
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IIncomeTaxExpenseAccount,
  IIncomeTaxExpenseAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IIncomeTaxExpenseAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

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
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IIncomeTaxExpenseAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >
) {
  return make(
    {
      name: payload.name,
      createdBy: payload.createdBy,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      isControlAccount: true,
      controlAccountId: null,
      meta: null,
    },
    null
  );
}

const taxExpenseAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default taxExpenseAccountEntity;
