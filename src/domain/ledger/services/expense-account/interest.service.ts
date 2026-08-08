import currencyEntity from '../../../money/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../../config/expense-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '../../types/expense-account.types';
import { IInterestAccountService } from '../../types/interest.service.types';
import { TInterestLedgerCode } from '../../types/ledger-code.types';
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
const LEDGER_CODE = EXPENSE_LEDGER_CODES.INTEREST;

function makeCreateHeader(
  deps: IDependencies
): IInterestAccountService['createHeader'] {
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
      subType: EExpenseSubType.Interest,
      behavior: EExpenseAccountBehavior.Interest,
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
): IInterestAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (account: ILedgerAccount) =>
      account.type === ELedgerType.Expense &&
      account.subType === EExpenseSubType.Interest &&
      account.isControlAccount &&
      (account.behavior === EExpenseAccountBehavior.Interest ||
        account.behavior === EExpenseAccountBehavior.Default);

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TInterestLedgerCode>({
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
      ledgerAccountEntity.getMaterializedPath<TInterestLedgerCode>(
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
      subType: EExpenseSubType.Interest,
      behavior: EExpenseAccountBehavior.Interest,
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

export default function makeInterestAccountService(deps: IDependencies) {
  const service: IInterestAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };
  return Object.freeze(service);
}
