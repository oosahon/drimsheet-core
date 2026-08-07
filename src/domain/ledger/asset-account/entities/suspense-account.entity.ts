/**
 * For non-power users, a suspense sub-ledger will predominantly be used for
 * bank reconciliation to temporary hold uncleared/unidentified outgoing payments
 *
 * @see {@link ../__docs__/suspense-account.md} to understand their behaviors
 *
 */
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetSuspenseAccount,
} from '../../types/asset-account.types';
import { TAssetSuspenseLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
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

  const [account, events, audit] =
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
  return [account, events, audit];
}

const assetSuspenseAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default assetSuspenseAccountEntity;
