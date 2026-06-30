/**
 * For non-power users, a suspense sub-ledger will predominantly be used for
 * bank reconciliation to temporary hold uncleared/unidentified outgoing payments
 *
 * @see {@link ../__docs__/suspense-account.md} to understand their behaviors
 *
 */
import { TAuditedEntity } from '../../../../shared/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TAssetSuspenseLedgerCode } from '../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../shared/types/ledger.types';
import assetAccountEvents from '../events/asset-account.events';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetSuspenseAccount,
} from '../types/asset-account.types';
import helpers from './helpers/suspense-account.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TAssetSuspenseLedgerCode;
  precedingCode: TAssetSuspenseLedgerCode;
}

function make(
  payload: Pick<
    IAssetSuspenseAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IAssetSuspenseAccount,
  IAssetSuspenseAccount,
  ILedgerAccount
> {
  const { name, createdBy, accountingEntityId, currency } = payload;

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IAssetSuspenseAccount>({
      name,
      accountingEntityId,

      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      code,
      materializedPath,
      type: ELedgerType.Asset,
      subType: EAssetSubType.Suspense,
      behavior: EAssetAccountBehavior.Default,
      meta: null,
      isControlAccount: false,
      controlAccountId: null,
      currency,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
  const event = assetAccountEvents.suspenseCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

const assetSuspenseAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default assetSuspenseAccountEntity;
