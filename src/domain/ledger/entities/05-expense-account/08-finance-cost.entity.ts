import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IFinanceCostAccount,
} from '../../types/expense-account.types';
import { TFinanceCostLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/finance-cost.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TFinanceCostLedgerCode;
  precedingCode: TFinanceCostLedgerCode;
}

function make(
  payload: Pick<
    IFinanceCostAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IFinanceCostAccount, IFinanceCostAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IFinanceCostAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.FinanceCost,
    behavior: EExpenseAccountBehavior.FinanceCost,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.financeCostCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

function makeHeader(
  payload: Pick<
    IFinanceCostAccount,
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

const financeCostAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default financeCostAccountEntity;
