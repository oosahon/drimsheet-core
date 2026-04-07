import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IRentUtilitiesAccount,
} from '../../types/expense-account.types';
import { TRentUtilitiesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TRentUtilitiesLedgerCode
): TRentUtilitiesLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TRentUtilitiesLedgerCode>(
    '502',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IRentUtilitiesAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TRentUtilitiesLedgerCode | null
): TEntityWithEvents<IRentUtilitiesAccount, IRentUtilitiesAccount> {
  const account = ledgerAccountEntity.make<IRentUtilitiesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '502000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.RentAndUtilities,
    behavior: EExpenseAccountBehavior.RentAndUtilities,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.rentAndUtilitiesCreated(account);
  return [account, [event]];
}

const rentAndUtilitiesAccountEntity = Object.freeze({
  make,
  getCode,
});

export default rentAndUtilitiesAccountEntity;
