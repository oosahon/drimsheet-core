import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../../shared/types/event.types';
import { AppError } from '../../../../shared/value-objects/error';
import stringUtils from '../../../../shared/utils/string';
import liabilityAccountEvents from '../../events/liability-account.events';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  IPayableAccount,
  IStatutoryPayableAccount,
  IStatutoryPayableAccountMeta,
  ITradePayableAccount,
  ITradePayableAccountMeta,
} from '../../types/liability-account.types';
import { ETaxType } from '../../types/tax.types';
import { TPayablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(predecessorCode: TPayablesLedgerCode): TPayablesLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TPayablesLedgerCode>(
    '201',
    predecessorCode
  );
}

/**
 * Creates a new payable account.
 * @param payload payable account creation payload
 * @param predecessorCode the ledger code of the most recent Payable sub ledger.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function make(
  payload: Pick<
    IPayableAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'behavior'
    | 'meta'
    | 'contraAccountRule'
    | 'adjunctAccountRule'
  >,
  predecessorCode: TPayablesLedgerCode | null // null for the control account
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  const account = ledgerAccountEntity.make<IPayableAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '201000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Liability),
    type: ELedgerType.Liability,
    subType: ELiabilitySubType.Payable,
    behavior: payload.behavior,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: payload.contraAccountRule,
    adjunctAccountRule: payload.adjunctAccountRule,
    createdBy: payload.createdBy,
  });

  const event = liabilityAccountEvents.payableCreated(account);
  return [account, [event]];
}

function makeStatutoryPayableAccountMeta(meta: IStatutoryPayableAccountMeta) {
  const taxAuthority = stringUtils.sanitizeAndValidate(meta.taxAuthority, {
    min: 2,
    max: 100,
  });

  if (!Object.values(ETaxType).includes(meta.taxType)) {
    throw new AppError('Invalid tax type provided', { cause: meta.taxType });
  }

  return Object.freeze<IStatutoryPayableAccountMeta>({
    taxAuthority,
    taxType: meta.taxType,
  });
}

/**
 * Creates a new statutory payable sub ledger.
 * @param payload statutory payable creation payload
 * @param predecessorCode the ledger code of the most recent Payable sub ledger.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeStatutoryPayableAccount(
  payload: TCreationOmits<IStatutoryPayableAccount>,
  predecessorCode: TPayablesLedgerCode
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TaxPayable,
      meta: makeStatutoryPayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    },
    predecessorCode
  );
}

function makeTradePayableAccountMeta(meta: ITradePayableAccountMeta) {
  stringUtils.validateUUID(meta.vendorId);
  stringUtils.validateUUID(meta.invoiceId);

  return Object.freeze<ITradePayableAccountMeta>({
    vendorId: meta.vendorId,
    invoiceId: meta.invoiceId,
  });
}

/**
 * Creates a new trade payable sub ledger.
 * @param payload trade payable creation payload
 * @param predecessorCode the ledger code of the most recent Payable sub ledger.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeTradePayableAccount(
  payload: TCreationOmits<ITradePayableAccount>,
  predecessorCode: TPayablesLedgerCode
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TradePayable,
      meta: makeTradePayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    },
    predecessorCode
  );
}

const payableAccountEntity = Object.freeze({
  make,

  makeStatutoryPayableAccountMeta,
  makeStatutoryPayableAccount,

  makeTradePayableAccountMeta,
  makeTradePayableAccount,

  getCode,
});

export default payableAccountEntity;
