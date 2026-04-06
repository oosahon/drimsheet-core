import { TEntityWithEvents } from '../../../../shared/types/event.types';
import stringUtils from '../../../../shared/utils/string';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseSubType,
  IDirectCostsAccount,
} from '../../types/expense-account.types';
import { TDirectCostsLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TDirectCostsLedgerCode
): TDirectCostsLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TDirectCostsLedgerCode>(
    '500',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IDirectCostsAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'behavior'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TDirectCostsLedgerCode | null
): TEntityWithEvents<IDirectCostsAccount, IDirectCostsAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  const account = ledgerAccountEntity.make<IDirectCostsAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '500000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.DirectCosts,
    behavior: payload.behavior,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.directCostsCreated(account);
  return [account, [event]];
}

const directCostsAccountEntity = Object.freeze({
  make,
  getCode,
});

export default directCostsAccountEntity;
