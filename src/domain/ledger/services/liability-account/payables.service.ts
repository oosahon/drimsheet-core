import currencyEntity from '../../../money/entities/currency.entity';
import { LIABILITY_LEDGER_CODES } from '../../config/liability-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import ledgerAccountCurrencyInvarianceRule from '../../rules/currency-invariance.rule';
import { TPayablesLedgerCode } from '../../types/ledger-code.types';
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
import { IPayablesAccountService } from '../../types/payables.service.types';
import payablesMetaValue from '../../values/payables-meta.vo.';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = LIABILITY_LEDGER_CODES.PAYABLES;

/**
 *
 * Creates a new payable account header
 *
 * @returns Audited IPayableAccount
 *
 */
function makeCreateHeader(
  deps: IDependencies
): IPayablesAccountService['createHeader'] {
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
      subType: ELiabilitySubType.Payable,
      behavior: ELiabilityAccountBehavior.DefaultPayable,
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
 * Creates a new statutory payable account
 *
 * @returns Audited IPayableAccount
 *
 */
function makeCreateStatutoryPayableSubAccount(
  deps: IDependencies
): IPayablesAccountService['createStatutoryPayableSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Liability &&
        controlAccount.subType === ELiabilitySubType.Payable &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior === ELiabilityAccountBehavior.DefaultPayable ||
          controlAccount.behavior === ELiabilityAccountBehavior.TaxPayable) &&
        controlAccount.currency !== null
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TPayablesLedgerCode>({
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
      ledgerAccountEntity.getMaterializedPath<TPayablesLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Payable,
      behavior: ELiabilityAccountBehavior.TaxPayable,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      status: ELedgerAccountStatus.Active,
      meta: payablesMetaValue.makeStatutoryMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

/**
 *
 * Creates a new payable account header
 *
 * @returns Audited IPayableAccount
 *
 */

function makeCreateTradePayableAccount(
  deps: IDependencies
): IPayablesAccountService['createTradePayableSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Liability &&
        controlAccount.subType === ELiabilitySubType.Payable &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior === ELiabilityAccountBehavior.DefaultPayable ||
          controlAccount.behavior === ELiabilityAccountBehavior.TradePayable)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TPayablesLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntity.id,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    ledgerAccountCurrencyInvarianceRule.validate({
      controlAccount,
      subAccountCurrency: null,
    });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TPayablesLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Payable,
      behavior: ELiabilityAccountBehavior.TradePayable,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: null,
      status: ELedgerAccountStatus.Active,
      meta: payablesMetaValue.makeTradeMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makePayablesAccountService(deps: IDependencies) {
  const service: IPayablesAccountService = {
    createHeader: makeCreateHeader(deps),
    createStatutoryPayableSubAccount:
      makeCreateStatutoryPayableSubAccount(deps),
    createTradePayableSubAccount: makeCreateTradePayableAccount(deps),
  };

  return Object.freeze(service);
}
