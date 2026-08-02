import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TGiftsLedgerCode } from '../../shared/types/ledger-code.types';
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
  IGiftsAccount,
} from '../types/revenue-account.types';
import helpers from './helpers/gifts.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TGiftsLedgerCode;
  precedingCode: TGiftsLedgerCode;
}

function make(
  payload: Pick<
    IGiftsAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IGiftsAccount, IGiftsAccount, ILedgerAccount> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IGiftsAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      type: ELedgerType.Revenue,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      subType: ERevenueSubType.Gifts,
      behavior: ERevenueAccountBehavior.Gifts,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = revenueAccountEvents.giftsCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IGiftsAccount,
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

const giftsAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default giftsAccountEntity;
