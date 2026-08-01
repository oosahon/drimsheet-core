import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TRetainedEarningsLedgerCode } from '../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../shared/types/ledger.types';
import equityAccountEvents from '../events/equity-account.events';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IRetainedEarningsAccount,
} from '../types/equity-account.types';
import helpers from './helpers/retained-earning.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TRetainedEarningsLedgerCode;
  precedingCode: TRetainedEarningsLedgerCode;
}

function make(
  payload: Pick<
    IRetainedEarningsAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IRetainedEarningsAccount,
  IRetainedEarningsAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IRetainedEarningsAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

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
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

const retainedEarningAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default retainedEarningAccountEntity;
