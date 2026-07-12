import { TAuditedEntity } from '../../../../shared/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TAssetDisposalLossLedgerCode } from '../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../shared/types/ledger.types';
import expenseAccountEvents from '../events/expense-account.events';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
} from '../types/expense-account.types';
import helpers from './helpers/asset-disposal-loss.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TAssetDisposalLossLedgerCode;
  precedingCode: TAssetDisposalLossLedgerCode;
}

function make(
  payload: Pick<
    IAssetDisposalLossAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IAssetDisposalLossAccount,
  IAssetDisposalLossAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IAssetDisposalLossAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
      type: ELedgerType.Expense,
      subType: EExpenseSubType.LossOnAssetDisposal,
      behavior: EExpenseAccountBehavior.AssetDisposalLoss,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = expenseAccountEvents.assetDisposalLossCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IAssetDisposalLossAccount,
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

const assetDisposalLossAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default assetDisposalLossAccountEntity;
