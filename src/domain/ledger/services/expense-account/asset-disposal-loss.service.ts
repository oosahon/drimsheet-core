import currencyEntity from '../../../money/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../../config/expense-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import { IAssetDisposalLossAccountService } from '../../types/asset-disposal-loss.service.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '../../types/expense-account.types';
import { TAssetDisposalLossLedgerCode } from '../../types/ledger-code.types';
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

const LEDGER_CODE = EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS;

/**
 *
 * Creates a new asset disposal loss header account
 *
 * @returns Audited IAssetDisposalLossAccount
 *
 */
function makeCreateHeader(
  deps: IDependencies
): IAssetDisposalLossAccountService['createHeader'] {
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
      subType: EExpenseSubType.LossOnAssetDisposal,
      behavior: EExpenseAccountBehavior.AssetDisposalLoss,
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

/**
 *
 * Creates a new asset disposal loss sub account
 *
 * @returns Audited IAssetDisposalLossAccount
 *
 */
function makeCreateSubAccount(
  deps: IDependencies
): IAssetDisposalLossAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Expense &&
        controlAccount.subType === EExpenseSubType.LossOnAssetDisposal &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior ===
          EExpenseAccountBehavior.AssetDisposalLoss ||
          controlAccount.behavior === EExpenseAccountBehavior.Default)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TAssetDisposalLossLedgerCode>({
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
      ledgerAccountEntity.getMaterializedPath<TAssetDisposalLossLedgerCode>(
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
      subType: EExpenseSubType.LossOnAssetDisposal,
      behavior: EExpenseAccountBehavior.AssetDisposalLoss,
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

export default function makeAssetDisposalService(deps: IDependencies) {
  const service: IAssetDisposalLossAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };

  return Object.freeze(service);
}
