import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import { TInterestLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IInterestAccount,
} from '../types/expense-account.types';
import helpers from './helpers/interest.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TInterestLedgerCode;
  precedingCode: TInterestLedgerCode;
}

function make(
  payload: Pick<
    IInterestAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IInterestAccount, IInterestAccount, ILedgerAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, events, audit] = ledgerAccountEntity.make<IInterestAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.Interest,
    behavior: EExpenseAccountBehavior.Interest,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  return [account, events, audit];
}

function makeHeader(
  payload: Pick<
    IInterestAccount,
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

const interestAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default interestAccountEntity;
