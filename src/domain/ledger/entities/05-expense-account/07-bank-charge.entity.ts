import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IBankChargeAccount,
} from '../../types/expense-account.types';
import { TBankChargeLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/bank-charge.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TBankChargeLedgerCode;
  precedingCode: TBankChargeLedgerCode;
}

function make(
  payload: Pick<
    IBankChargeAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IBankChargeAccount, IBankChargeAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IBankChargeAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.BankCharge,
    behavior: EExpenseAccountBehavior.BankCharge,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.bankChargeCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

function makeHeader(
  payload: Pick<
    IBankChargeAccount,
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

const bankChargeAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default bankChargeAccountEntity;
