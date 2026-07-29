import { TAuditedEntity } from '../../../../shared/events/types/event.types';
import stringUtils from '../../../../shared/utils/string';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import ledgerError from '../../shared/errors/ledger.error';
import { TCashLedgerCode } from '../../shared/types/ledger-code.types';
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
  IBankAccount,
  ICashAndCashEquivalentAccount,
  IPettyCashAccount,
  IPettyCashAccountMeta,
} from '../types/asset-account.types';
import bankAccountValue from '../values/bank-account.vo';
import helpers from './helpers/cash.entity.helpers';

interface IScopeDetails {
  parentMaterializedPath: TCashLedgerCode;
  precedingCode: TCashLedgerCode;
}

/**
 * Creates a new cash and cash equivalent header/sub account.
 * @param payload cash and cash equivalent account creation payload
 * @param predecessorCode the ledger code of the most recent Cash and Cash Equivalent account.
 * @returns [ICashAndCashEquivalentAccount, ICashCreationEvent]
 */
function make(
  payload: Pick<
    ICashAndCashEquivalentAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'behavior'
    | 'meta'
  >,
  scope: IScopeDetails | null // null for the header account
): TAuditedEntity<
  ICashAndCashEquivalentAccount,
  ICashAndCashEquivalentAccount,
  ILedgerAccount
> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(
      payload.controlAccountId,
      ledgerError.InvalidValue
    );
  }

  const code = helpers.getCode(scope?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    scope?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<ICashAndCashEquivalentAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior: payload.behavior,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.createdBy,
    });

  const event = assetAccountEvents.cashAndEquivalentCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    ICashAndCashEquivalentAccount,
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
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
    },
    null
  );
}

/**
 * Creates a new petty cash sub account.
 * @param payload petty cash creation payload
 * @param scope the ledger details of the most recent Cash and Cash Equivalent account.
 * @returns [ICashAndCashEquivalentAccount, ICashCreationEvent]
 */
function makePettyCashAccount(
  payload: Pick<
    IPettyCashAccount,
    | 'name'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'createdBy'
    | 'accountingEntityId'
  >,
  scope: IScopeDetails | null
): TAuditedEntity<
  ICashAndCashEquivalentAccount,
  ICashAndCashEquivalentAccount,
  ILedgerAccount
> {
  const meta: IPettyCashAccountMeta = Object.freeze({
    lastReconciliationDate: null,
  });

  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: !!payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: EAssetAccountBehavior.PettyCash,
      meta,
    },
    scope
  );
}

/**
 * Creates a new bank account sub account.
 * @param payload bank account creation payload
 * @param scope the ledger details of the most recent Cash and Cash Equivalent account.
 * @returns [ICashAndCashEquivalentAccount, ICashCreationEvent]
 */
function makeBankAccount(
  payload: Pick<
    IBankAccount,
    | 'name'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'createdBy'
    | 'accountingEntityId'
    | 'meta'
  >,
  scope: IScopeDetails | null
): TAuditedEntity<
  ICashAndCashEquivalentAccount,
  ICashAndCashEquivalentAccount,
  ILedgerAccount
> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: EAssetAccountBehavior.Bank,
      meta: bankAccountValue.make(payload.meta),
    },
    scope
  );
}

const cashAndEquivalentAccountEntity = Object.freeze({
  make,
  makeHeader,
  makePettyCashAccount,
  makeBankAccount,

  ...helpers,
});

export default cashAndEquivalentAccountEntity;
