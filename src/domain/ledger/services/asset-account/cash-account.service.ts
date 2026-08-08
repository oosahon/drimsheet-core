import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import ledgerAccountCurrencyInvarianceRule from '@domain/ledger/rules/currency-invariance.rule';
import controlAccountResolverHelper from '@domain/ledger/services/helpers/control-account-resolver';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import ICashAccountService from '@domain/ledger/types/cash-account.service.types';
import { TCashLedgerCode } from '@domain/ledger/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';
import bankDetailsValue from '@domain/ledger/values/bank-details.vo';
import currencyEntity from '@domain/money/entities/currency.entity';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS;

/**
 *
 * Creates a new cash account header account
 *
 * @returns Audited ICashAndCashEquivalentAccount
 *
 */
function makeCreateHeader(
  deps: IDependencies
): ICashAccountService['createHeader'] {
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
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior: EAssetAccountBehavior.DefaultCash,
      isControlAccount: true,
      controlAccountId: null,
      currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.userId,
    });
  };
}

/**
 *
 * Creates a new petty cash account
 *
 * @param deps IDependencies
 * @returns Audited ICashAndCashEquivalentAccount
 *
 */
function makeCreatePettyCashSubAccount(
  deps: IDependencies
): ICashAccountService['createPettyCashSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Asset &&
        controlAccount.subType === EAssetSubType.CashAndCashEquivalent &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior === EAssetAccountBehavior.PettyCash ||
          controlAccount.behavior === EAssetAccountBehavior.DefaultCash)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TCashLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntity.id,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    ledgerAccountCurrencyInvarianceRule.validate({
      controlAccount,
      subAccountCurrency: payload.currency,
    });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TCashLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior: EAssetAccountBehavior.PettyCash,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.userId,
    });
  };
}

/**
 *
 * Creates a new petty cash account
 *
 * @param deps IDependencies
 * @returns Audited ICashAndCashEquivalentAccount
 *
 */
function makeCreateBankSubAccount(
  deps: IDependencies
): ICashAccountService['createBankSubAccount'] {
  const validator = (controlAccount: ILedgerAccount) => {
    return (
      controlAccount.type === ELedgerType.Asset &&
      controlAccount.subType === EAssetSubType.CashAndCashEquivalent &&
      (controlAccount.behavior === EAssetAccountBehavior.DefaultCash ||
        controlAccount.behavior === EAssetAccountBehavior.Bank) &&
      controlAccount.isControlAccount
    );
  };

  return async (payload, repoOptions) => {
    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TCashLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntity.id,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    ledgerAccountCurrencyInvarianceRule.validate({
      controlAccount,
      subAccountCurrency: payload.currency,
    });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TCashLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior: EAssetAccountBehavior.Bank,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      meta: bankDetailsValue.make(payload.bankDetails),
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.userId,
    });
  };
}

/**
 * ================================ MAIN SERVICE ================================
 * @param deps
 * @returns d
 */

export default function makeCashAccountService(
  deps: IDependencies
): ICashAccountService {
  const service: ICashAccountService = {
    createHeader: makeCreateHeader(deps),
    createPettyCashSubAccount: makeCreatePettyCashSubAccount(deps),
    createBankSubAccount: makeCreateBankSubAccount(deps),
  };

  return Object.freeze(service);
}
