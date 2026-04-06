/**
 * For non-power users, a suspense sub-ledger will predominantly be used for
 * bank reconciliation to temporary hold uncleared/unidentified outgoing payments
 *
 * @see {@link ../__docs__/suspense-account.md} to understand their behaviors
 *
 */
import { TEntityWithEvents } from '../../../../shared/types/event.types';
import assetAccountEvents from '../../events/asset-account.events';
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
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(predecessorCode: TAssetSuspenseLedgerCode) {
  return ledgerAccountEntity.getSubLedgerCode<TAssetSuspenseLedgerCode>(
    '199',
    predecessorCode
  );
}

function make(
  payload: Pick<
    IAssetSuspenseAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  predecessorCode: TAssetSuspenseLedgerCode
): TEntityWithEvents<IAssetSuspenseAccount, IAssetSuspenseAccount> {
  const { name, createdBy, accountingEntityId, currency } = payload;

  const account = ledgerAccountEntity.make<IAssetSuspenseAccount>({
    name,
    accountingEntityId,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
    code: getCode(predecessorCode),
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
  return [account, [event]];
}

const assetSuspenseAccountEntity = Object.freeze({
  make,
  getCode,
});

export default assetSuspenseAccountEntity;
