import stringUtils from '../../../../shared/utils/string';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import { TShortTermDebtLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import liabilityAccountEvents from '../events/liability-account.events';
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
} from '../types/liability-account.types';
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
): TAuditedEntity<
  IShortTermDebtAccount,
  IShortTermDebtAccount,
  ILedgerAccount
> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(
      payload.controlAccountId,
      ledgerAccountError.InvalidControlAccountId
    );
  }

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IShortTermDebtAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
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
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IShortTermDebtAccount,
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
      behavior: ELiabilityAccountBehavior.DefaultShortTermDebt,
      meta: null,
    },
    null
  );
}

function makeCreditCardAccountMeta(meta: ICreditCardAccountMeta) {
  const cardIssuer = stringUtils.sanitizeAndValidate(
    meta.cardIssuer,
    {
      min: 2,
      max: 100,
    },
    ledgerAccountError.InvalidCardIssuer
  );

  const lastFourDigits = stringUtils.sanitizeAndValidate(
    meta.lastFourDigits,
    {
      min: 4,
      max: 4,
    },
    ledgerAccountError.InvalidLastFourDigits
  );

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
  payload: Pick<
    ICreditCardAccount,
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
  IShortTermDebtAccount,
  IShortTermDebtAccount,
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
      behavior: ELiabilityAccountBehavior.CreditCard,
      meta: makeCreditCardAccountMeta(payload.meta),
    },
    parent
  );
}

function makeOverdraftAccountMeta(meta: IOverdraftAccountMeta) {
  stringUtils.validateUUID(
    meta.linkedBankAccountId,
    ledgerAccountError.InvalidLinkedBankAccountId
  );

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
  payload: Pick<
    IOverdraftAccount,
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
  IShortTermDebtAccount,
  IShortTermDebtAccount,
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
      behavior: ELiabilityAccountBehavior.Overdraft,
      meta: makeOverdraftAccountMeta(payload.meta),
    },
    parent
  );
}

function makeShortTermLoanAccountMeta(meta: IShortTermLoanAccountMeta) {
  const lenderName = stringUtils.sanitizeAndValidate(
    meta.lenderName,
    {
      min: 2,
      max: 100,
    },
    ledgerAccountError.InvalidLenderName
  );

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
  payload: Pick<
    IShortTermLoanAccount,
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
  IShortTermDebtAccount,
  IShortTermDebtAccount,
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
      behavior: ELiabilityAccountBehavior.ShortTermLoan,
      meta: makeShortTermLoanAccountMeta(payload.meta),
    },
    parent
  );
}

const shortTermLoanAccountEntity = Object.freeze({
  make,
  makeHeader,

  makeCreditCardAccountMeta,
  makeCreditCardAccount,

  makeOverdraftAccountMeta,
  makeOverdraftAccount,

  makeShortTermLoanAccountMeta,
  makeShortTermLoanAccount,

  ...helpers,
});

export default shortTermLoanAccountEntity;
