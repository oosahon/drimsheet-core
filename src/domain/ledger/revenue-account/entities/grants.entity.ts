import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TGrantsLedgerCode } from '../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../shared/types/ledger.types';
import revenueAccountEvents from '../events/revenue-account.events';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IGrantsAccount,
} from '../types/revenue-account.types';
import helpers from './helpers/grants.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TGrantsLedgerCode;
  precedingCode: TGrantsLedgerCode;
}

function make(
  payload: Pick<
    IGrantsAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IGrantsAccount, IGrantsAccount, ILedgerAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IGrantsAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      type: ELedgerType.Revenue,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      subType: ERevenueSubType.Grants,
      behavior: ERevenueAccountBehavior.Grants,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = revenueAccountEvents.grantsCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IGrantsAccount,
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

const grantsAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default grantsAccountEntity;
