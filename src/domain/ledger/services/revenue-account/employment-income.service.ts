import currencyEntity from '../../../money/entities/currency.entity';
import { REVENUE_LEDGER_CODES } from '../../config/revenue-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import ledgerAccountCurrencyInvarianceRule from '../../rules/currency-invariance.rule';
import { IEmploymentIncomeAccountService } from '../../types/employment-income.service.types';
import { TEmploymentIncomeLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../types/revenue-account.types';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME;

function makeCreateHeader(
  deps: IDependencies
): IEmploymentIncomeAccountService['createHeader'] {
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
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.EmploymentIncome,
      behavior: ERevenueAccountBehavior.EmploymentIncome,
      isControlAccount: true,
      controlAccountId: null,
      currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

function makeCreateSubAccount(
  deps: IDependencies
): IEmploymentIncomeAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Revenue &&
        controlAccount.subType === ERevenueSubType.EmploymentIncome &&
        controlAccount.isControlAccount &&
        controlAccount.behavior === ERevenueAccountBehavior.EmploymentIncome
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TEmploymentIncomeLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntityId,
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
      ledgerAccountEntity.getMaterializedPath<TEmploymentIncomeLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.EmploymentIncome,
      behavior: ERevenueAccountBehavior.EmploymentIncome,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: null,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makeEmploymentIncomeAccountService(
  deps: IDependencies
) {
  const service: IEmploymentIncomeAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };

  return Object.freeze(service);
}
