import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../../shared/types/event.types';
import stringUtils from '../../../../shared/utils/string';
import { AppError } from '../../../../shared/value-objects/error';
import ledgerAccountEvents from '../../events/ledger-account.events';
import liabilityAccountEvents from '../../events/liability-account.events';
import { TPayablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
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
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/payables.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TPayablesLedgerCode;
  precedingCode: TPayablesLedgerCode;
}

/**
 * Creates a new payable header/sub account.
 * @param payload payable account creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function make(
  payload: Pick<
    IPayableAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'accountingContextId'
    | 'accountingContextId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'behavior'
    | 'meta'
    | 'contraAccountRule'
    | 'adjunctAccountRule'
  >,
  parent: IParentDetails | null // null for the header account
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IPayableAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    accountingContextId: payload.accountingContextId,
    code,
    materializedPath,
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
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
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
 * Creates a new statutory payable sub account.
 * @param payload statutory payable creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeStatutoryPayableAccount(
  payload: TCreationOmits<IStatutoryPayableAccount>,
  parent: IParentDetails | null
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      accountingContextId: payload.accountingContextId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TaxPayable,
      meta: makeStatutoryPayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    },
    parent
  );
}

function makeTradePayableAccountMeta(meta: ITradePayableAccountMeta) {
  stringUtils.validateUUID(meta.counterpartyId);
  stringUtils.validateUUID(meta.invoiceId);

  return Object.freeze<ITradePayableAccountMeta>({
    counterpartyId: meta.counterpartyId,
    invoiceId: meta.invoiceId,
  });
}

/**
 * Creates a new trade payable sub account.
 * @param payload trade payable creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeTradePayableAccount(
  payload: TCreationOmits<ITradePayableAccount>,
  parent: IParentDetails | null
): TEntityWithEvents<IPayableAccount, IPayableAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      accountingContextId: payload.accountingContextId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TradePayable,
      meta: makeTradePayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    },
    parent
  );
}

const payableAccountEntity = Object.freeze({
  make,

  makeStatutoryPayableAccountMeta,
  makeStatutoryPayableAccount,

  makeTradePayableAccountMeta,
  makeTradePayableAccount,

  ...helpers,
});

export default payableAccountEntity;
