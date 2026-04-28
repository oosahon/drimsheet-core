import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../../shared/types/event.types';
import stringUtils from '../../../../shared/utils/string';
import ledgerAccountEvents from '../../events/ledger-account.events';
import liabilityAccountEvents from '../../events/liability-account.events';
import { TShortTermDebtLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ICreditCardAccount,
  ICreditCardAccountMeta,
  IOverdraftAccount,
  IOverdraftAccountMeta,
  IShortTermDebtAccount,
  IShortTermLoanAccount,
  IShortTermLoanAccountMeta,
} from '../../types/liability-account.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/short-term-loan.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TShortTermDebtLedgerCode;
  precedingCode: TShortTermDebtLedgerCode;
}

/**
 * Creates a new short term debt header/sub account.
 * @param payload short term debt account creation payload
 * @param parent the ledger code of the most recent Short Term Debt account.
 * @returns [IShortTermDebtAccount, IShortTermDebtCreationEvent]
 */
function make(
  payload: Pick<
    IShortTermDebtAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'behavior'
    | 'meta'
  >,
  parent: IParentDetails | null // null for the header account
): TEntityWithEvents<IShortTermDebtAccount, IShortTermDebtAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IShortTermDebtAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Liability),
    type: ELedgerType.Liability,
    subType: ELiabilitySubType.ShortTermDebt,
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

  const event = liabilityAccountEvents.shortTermLoanCreated(account);
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

function makeCreditCardAccountMeta(meta: ICreditCardAccountMeta) {
  const cardIssuer = stringUtils.sanitizeAndValidate(meta.cardIssuer, {
    min: 2,
    max: 100,
  });

  const lastFourDigits = stringUtils.sanitizeAndValidate(meta.lastFourDigits, {
    min: 4,
    max: 4,
  });

  return Object.freeze<ICreditCardAccountMeta>({
    cardIssuer,
    lastFourDigits,
    lastReconciliationDate: null,
  });
}

/**
 * Creates a new credit card sub account.
 * @param payload credit card creation payload
 * @param parent the ledger code of the most recent Short Term Debt account.
 * @returns [IShortTermDebtAccount, IShortTermDebtCreationEvent]
 */
function makeCreditCardAccount(
  payload: TCreationOmits<ICreditCardAccount>,
  parent: IParentDetails | null
): TEntityWithEvents<IShortTermDebtAccount, IShortTermDebtAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.CreditCard,
      meta: makeCreditCardAccountMeta(payload.meta),
    },
    parent
  );
}

function makeOverdraftAccountMeta(meta: IOverdraftAccountMeta) {
  stringUtils.validateUUID(meta.linkedBankAccountId);

  return Object.freeze<IOverdraftAccountMeta>({
    linkedBankAccountId: meta.linkedBankAccountId,
  });
}

/**
 * Creates a new overdraft sub account.
 * @param payload overdraft creation payload
 * @param parent the ledger code of the most recent Short Term Debt account.
 * @returns [IShortTermDebtAccount, IShortTermDebtCreationEvent]
 */
function makeOverdraftAccount(
  payload: TCreationOmits<IOverdraftAccount>,
  parent: IParentDetails | null
): TEntityWithEvents<IShortTermDebtAccount, IShortTermDebtAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.Overdraft,
      meta: makeOverdraftAccountMeta(payload.meta),
    },
    parent
  );
}

function makeShortTermLoanAccountMeta(meta: IShortTermLoanAccountMeta) {
  const lenderName = stringUtils.sanitizeAndValidate(meta.lenderName, {
    min: 2,
    max: 100,
  });

  return Object.freeze<IShortTermLoanAccountMeta>({
    lenderName,
    maturityDate: meta.maturityDate,
  });
}

/**
 * Creates a new short term loan sub account.
 * @param payload short term loan creation payload
 * @param parent the ledger code of the most recent Short Term Debt account.
 * @returns [IShortTermDebtAccount, IShortTermDebtCreationEvent]
 */
function makeShortTermLoanAccount(
  payload: TCreationOmits<IShortTermLoanAccount>,
  parent: IParentDetails | null
): TEntityWithEvents<IShortTermDebtAccount, IShortTermDebtAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.ShortTermLoan,
      meta: makeShortTermLoanAccountMeta(payload.meta),
    },
    parent
  );
}

const shortTermLoanAccountEntity = Object.freeze({
  make,

  makeCreditCardAccountMeta,
  makeCreditCardAccount,

  makeOverdraftAccountMeta,
  makeOverdraftAccount,

  makeShortTermLoanAccountMeta,
  makeShortTermLoanAccount,

  ...helpers,
});

export default shortTermLoanAccountEntity;
