import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import { TServicesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IServicesAccount,
} from '../types/revenue-account.types';
import helpers from './helpers/services.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TServicesLedgerCode;
  precedingCode: TServicesLedgerCode;
}

function make(
  payload: Pick<
    IServicesAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IServicesAccount, IServicesAccount, ILedgerAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, events, audit] = ledgerAccountEntity.make<IServicesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.Services,
    behavior: ERevenueAccountBehavior.Services,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy: payload.createdBy,
  });

  return [account, events, audit];
}

function makeHeader(
  payload: Pick<
    IServicesAccount,
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

const servicesAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default servicesAccountEntity;
