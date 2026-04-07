import { TEntityWithEvents } from '../../../../shared/types/event.types';
import revenueAccountEvents from '../../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IEmploymentIncomeAccount,
} from '../../types/revenue-account.types';
import { TEmploymentIncomeLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TEmploymentIncomeLedgerCode
): TEmploymentIncomeLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TEmploymentIncomeLedgerCode>(
    '403',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IEmploymentIncomeAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  predecessorCode: TEmploymentIncomeLedgerCode | null
): TEntityWithEvents<IEmploymentIncomeAccount, IEmploymentIncomeAccount> {
  const account = ledgerAccountEntity.make<IEmploymentIncomeAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '403000',
    type: ELedgerType.Revenue,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    subType: ERevenueSubType.EmploymentIncome,
    behavior: ERevenueAccountBehavior.EmploymentIncome,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.employmentIncomeCreated(account);
  return [account, [event]];
}

const employmentIncomeAccountEntity = Object.freeze({
  make,
  getCode,
});

export default employmentIncomeAccountEntity;
