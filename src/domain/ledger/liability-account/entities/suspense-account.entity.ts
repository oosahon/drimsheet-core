import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TLiabilitySuspenseLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import liabilityAccountEvents from '../events/liability-account.events';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilitySuspenseAccount,
} from '../types/liability-account.types';
import helpers from './helpers/suspense-account.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TLiabilitySuspenseLedgerCode;
  precedingCode: TLiabilitySuspenseLedgerCode;
}

function make(
  payload: Pick<
    ILiabilitySuspenseAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  ILiabilitySuspenseAccount,
  ILiabilitySuspenseAccount,
  ILedgerAccount
> {
  const { name, createdBy, accountingEntityId, currency } = payload;

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<ILiabilitySuspenseAccount>({
      name,
      accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Suspense,
      behavior: ELiabilityAccountBehavior.Default,
      meta: null,
      isControlAccount: false,
      controlAccountId: null,
      currency,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
  const event = liabilityAccountEvents.suspenseCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

const liabilitySuspenseAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default liabilitySuspenseAccountEntity;
