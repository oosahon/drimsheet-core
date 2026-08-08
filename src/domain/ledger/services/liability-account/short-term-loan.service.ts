import currencyEntity from '../../../money/entities/currency.entity';
import { LIABILITY_LEDGER_CODES } from '../../config/liability-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import { TShortTermDebtLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '../../types/liability-account.types';
import { IShortTermLoanAccountService } from '../../types/short-term-loan.service.types';
import creditCardMetaValue from '../../values/credit-card-meta.vo';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT;

/**
 *
 * Creates a new short term loan account header
 *
 * @returns Audited IShortTermDebtAccount
 *
 */
function makeCreateHeader(
  deps: IDependencies
): IShortTermLoanAccountService['createHeader'] {
  return async (payload, repoOptions) => {
    const existingHeader = await deps.ledgerAccountRepo.findByCode(
      LEDGER_CODE.HEADER,
      payload.accountingEntity.id,
      repoOptions
    );

    if (existingHeader) {
      throw new ledgerAccountError.HeaderAccountAlreadyExists({
        existingHeader,
      });
    }

    const currency = currencyEntity.getByCode(
      payload.accountingEntity.functionalCurrencyCode
    );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code: LEDGER_CODE.HEADER,
      materializedPath: LEDGER_CODE.HEADER,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.ShortTermDebt,
      behavior: ELiabilityAccountBehavior.ShortTermLoan,
      isControlAccount: true,
      controlAccountId: null,
      currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.createdBy,
    });
  };
}

/**
 *
 * Creates a new short term loan sub account
 *
 * @returns Audited IShortTermDebtAccount
 */
function makeCreateSubAccount(
  deps: IDependencies
): IShortTermLoanAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Liability &&
        controlAccount.subType === ELiabilitySubType.ShortTermDebt &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior ===
          ELiabilityAccountBehavior.DefaultShortTermDebt ||
          controlAccount.behavior ===
            ELiabilityAccountBehavior.ShortTermLoan) &&
        (controlAccount.currency !== null || payload.currency === null)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TShortTermDebtLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntityId,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TShortTermDebtLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.ShortTermDebt,
      behavior: ELiabilityAccountBehavior.ShortTermLoan,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      status: ELedgerAccountStatus.Active,
      meta: null,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.createdBy,
    });
  };
}

function makeCreateCreditCardSubAccount(
  deps: IDependencies
): IShortTermLoanAccountService['createCreditCardSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Liability &&
        controlAccount.subType === ELiabilitySubType.ShortTermDebt &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior ===
          ELiabilityAccountBehavior.DefaultShortTermDebt ||
          controlAccount.behavior === ELiabilityAccountBehavior.CreditCard) &&
        controlAccount.currency !== null
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TShortTermDebtLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntityId,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TShortTermDebtLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.ShortTermDebt,
      behavior: ELiabilityAccountBehavior.CreditCard,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      status: ELedgerAccountStatus.Active,
      meta: creditCardMetaValue.make(payload.meta),
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makeShortTermLoanService(deps: IDependencies) {
  const service: IShortTermLoanAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
    createCreditCardSubAccount: makeCreateCreditCardSubAccount(deps),
  };

  return Object.freeze(service);
}
