import { TEntityWithEvents } from '../../../../shared/types/event.types';
import equityAccountEvents from '../../events/equity-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IRetainedEarningsAccount,
} from '../../types/equity-account.types';
import { TRetainedEarningsLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/retained-earning.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TRetainedEarningsLedgerCode;
  precedingCode: TRetainedEarningsLedgerCode;
}

function make(
  payload: Pick<
    IRetainedEarningsAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'accountingContextId'
    | 'accountingContextId'
    | 'currency'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IRetainedEarningsAccount, IRetainedEarningsAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IRetainedEarningsAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    accountingContextId: payload.accountingContextId,
    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Equity),
    type: ELedgerType.Equity,
    subType: EEquitySubType.RetainedEarnings,
    behavior: EEquityAccountBehavior.RetainedEarnings,
    isControlAccount: false,
    controlAccountId: null,
    currency: payload.currency,
    meta: null,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = equityAccountEvents.retainedEarningsCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const retainedEarningAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default retainedEarningAccountEntity;
