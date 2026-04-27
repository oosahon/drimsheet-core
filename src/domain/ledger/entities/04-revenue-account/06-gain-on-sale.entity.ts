import { TEntityWithEvents } from '../../../../shared/types/event.types';
import ledgerAccountEvents from '../../events/ledger-account.events';
import revenueAccountEvents from '../../events/revenue-account.events';
import { TGainOnAssetSaleLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IGainOnAssetSaleAccount,
} from '../../types/revenue-account.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/gain-on-sale.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TGainOnAssetSaleLedgerCode;
  precedingCode: TGainOnAssetSaleLedgerCode;
}

function make(
  payload: Pick<
    IGainOnAssetSaleAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'accountingContextId'
    | 'accountingContextId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TEntityWithEvents<IGainOnAssetSaleAccount, IGainOnAssetSaleAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IGainOnAssetSaleAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    accountingContextId: payload.accountingContextId,
    code,
    materializedPath,
    type: ELedgerType.Revenue,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    subType: ERevenueSubType.GainOnAssetSale,
    behavior: ERevenueAccountBehavior.GainOnAssetSale,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  const event = revenueAccountEvents.GainOnAssetSaleCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const GainOnAssetSaleAccountEntity = Object.freeze({
  make,
  ...helpers,
});

export default GainOnAssetSaleAccountEntity;
