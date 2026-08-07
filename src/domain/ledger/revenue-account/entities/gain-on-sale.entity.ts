import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TGainOnAssetSaleLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import revenueAccountEvents from '../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IGainOnAssetSaleAccount,
} from '../types/revenue-account.types';
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
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IGainOnAssetSaleAccount,
  IGainOnAssetSaleAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IGainOnAssetSaleAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

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
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IGainOnAssetSaleAccount,
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

const GainOnAssetSaleAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default GainOnAssetSaleAccountEntity;
