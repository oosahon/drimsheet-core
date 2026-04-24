import { TEntityWithEvents } from '../../../../shared/types/event.types';
import expenseAccountEvents from '../../events/expense-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IUnrealizedLossAccount,
} from '../../types/expense-account.types';
import { TUnrealizedLossLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/unrealized-loss.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TUnrealizedLossLedgerCode;
  precedingCode: TUnrealizedLossLedgerCode;
}

function make(
  payload: Pick<
    IUnrealizedLossAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IUnrealizedLossAccount, IUnrealizedLossAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IUnrealizedLossAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
    type: ELedgerType.Expense,
    subType: EExpenseSubType.UnrealizedLoss,
    behavior: EExpenseAccountBehavior.UnrealizedLoss,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = expenseAccountEvents.unrealizedLossCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const unrealizedLossAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default unrealizedLossAccountEntity;
