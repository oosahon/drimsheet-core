import currencyEntity from '../../../money/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../../config/expense-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '../../types/expense-account.types';
import { IFinanceCostAccountService } from '../../types/finance-cost.service.types';
import { TFinanceCostLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}
const LEDGER_CODE = EXPENSE_LEDGER_CODES.FINANCE_COST;

function makeCreateHeader(
  deps: IDependencies
): IFinanceCostAccountService['createHeader'] {
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
      subType: EExpenseSubType.FinanceCost,
      behavior: EExpenseAccountBehavior.FinanceCost,
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
): IFinanceCostAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (account: ILedgerAccount) =>
      account.type === ELedgerType.Expense &&
      account.subType === EExpenseSubType.FinanceCost &&
      account.isControlAccount &&
      (account.behavior === EExpenseAccountBehavior.FinanceCost ||
        account.behavior === EExpenseAccountBehavior.Default);

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TFinanceCostLedgerCode>({
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
      ledgerAccountEntity.getMaterializedPath<TFinanceCostLedgerCode>(
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
      subType: EExpenseSubType.FinanceCost,
      behavior: EExpenseAccountBehavior.FinanceCost,
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

export default function makeFinanceCostAccountService(deps: IDependencies) {
  const service: IFinanceCostAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };
  return Object.freeze(service);
}
