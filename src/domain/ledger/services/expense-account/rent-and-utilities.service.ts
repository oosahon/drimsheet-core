import currencyEntity from '../../../money/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../../config/expense-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '../../types/expense-account.types';
import { TRentUtilitiesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import { IRentAndUtilitiesAccountService } from '../../types/rent-and-utilities.service.types';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}
const LEDGER_CODE = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES;

function makeCreateHeader(
  deps: IDependencies
): IRentAndUtilitiesAccountService['createHeader'] {
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
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
      type: ELedgerType.Expense,
      subType: EExpenseSubType.RentAndUtilities,
      behavior: EExpenseAccountBehavior.RentAndUtilities,
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
): IRentAndUtilitiesAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (account: ILedgerAccount) =>
      account.type === ELedgerType.Expense &&
      account.subType === EExpenseSubType.RentAndUtilities &&
      account.isControlAccount &&
      (account.behavior === EExpenseAccountBehavior.RentAndUtilities ||
        account.behavior === EExpenseAccountBehavior.Default);
    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TRentUtilitiesLedgerCode>({
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
      ledgerAccountEntity.getMaterializedPath<TRentUtilitiesLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );
    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
      type: ELedgerType.Expense,
      subType: EExpenseSubType.RentAndUtilities,
      behavior: EExpenseAccountBehavior.RentAndUtilities,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makeRentAndUtilitiesAccountService(
  deps: IDependencies
) {
  const service: IRentAndUtilitiesAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };
  return Object.freeze(service);
}
