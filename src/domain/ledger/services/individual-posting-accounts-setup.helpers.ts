import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../currency/types/currency.types';
import assetSuspenseAccountEntity from '../entities/01-asset-account/99-suspense-account.entity';
import servicesAccountEntity from '../entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../entities/04-revenue-account/04-employment-income.entity';
import GainOnAssetSaleAccountEntity from '../entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../entities/04-revenue-account/07-unrealized-gain.entity';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import financeCostsAccountEntity from '../entities/05-expense-account/07-finance-costs.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/08-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/09-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/10-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  EAssetSubType,
  IAssetSuspenseAccount,
} from '../types/asset-account.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IExpenseLedgerAccount,
} from '../types/expense-account.types';
import {
  ERevenueSubType,
  IRevenueLedgerAccount,
} from '../types/revenue-account.types';
import {
  ELedgerType,
  ILedgerAccount,
  ULedgerType,
} from '../types/ledger.types';
import { AppError } from '../../../shared/value-objects/error';

interface IParams {
  userId: TEntityId;
  accountingEntityId: TEntityId;
  functionalCurrency: ICurrency;
}

type THelper<T extends ILedgerAccount> = (
  params: IParams,
  repo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => Promise<TEntityWithEvents<T, T>[]>;

// ================ Liability Posting Accounts =================
interface ICanMakeAccountParams {
  accountingEntityId: TEntityId;
  type: ULedgerType;
  subType: string;
  controlLedgerCode: string;
}

async function canMakeAccount(
  params: ICanMakeAccountParams,
  repo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) {
  const { accountingEntityId, type, subType, controlLedgerCode } = params;

  const existingAccounts = await repo.findBySubType(
    accountingEntityId,
    type,
    subType,
    repoOptions
  );

  const controlAccount = await repo.findByCode(
    controlLedgerCode,
    accountingEntityId,
    repoOptions
  );

  if (!controlAccount) {
    throw new AppError('Control account not found', {
      cause: { controlLedgerCode },
    });
  }

  if (controlAccount.type !== type) {
    throw new AppError('Control account type does not match', {
      cause: { controlLedgerCode, type },
    });
  }

  const nonControlAccountInType = existingAccounts.filter(
    (account) => !account.isControlAccount
  );

  return {
    canMake: !nonControlAccountInType.length,
    controlAccount,
  };
}

// ========== Revenue Posting Accounts ==========
type TRevenueHelper = THelper<IRevenueLedgerAccount>;

/**
 * ============ Default Services Revenue Account ============
 */
const makeDefaultServicesAccount: TRevenueHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IRevenueLedgerAccount,
    IRevenueLedgerAccount
  >[] = [];

  const controlLedgerCode = '401000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.Services,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = servicesAccountEntity.make(
    {
      name: 'Services (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultEmploymentIncomeAccount: TRevenueHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IRevenueLedgerAccount,
    IRevenueLedgerAccount
  >[] = [];

  const controlLedgerCode = '403000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.EmploymentIncome,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = employmentIncomeAccountEntity.make(
    {
      name: 'Employment Income (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultGainOnAssetsAccount: TRevenueHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IRevenueLedgerAccount,
    IRevenueLedgerAccount
  >[] = [];

  const controlLedgerCode = '405000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.GainOnAssetSale,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = GainOnAssetSaleAccountEntity.make(
    {
      name: 'Gain on Assets (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultUnrealizedGainsAccount: TRevenueHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IRevenueLedgerAccount,
    IRevenueLedgerAccount
  >[] = [];

  const controlLedgerCode = '406000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Revenue,
    subType: ERevenueSubType.UnrealizedGains,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = unrealizedGainAccountEntity.make(
    {
      name: 'Unrealized Gains (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

// ========== Expense Posting Accounts ==========

type TExpenseHelper = THelper<IExpenseLedgerAccount>;

const makeDefaultDirectCostsAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '500000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.DirectCosts,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = directCostsAccountEntity.make(
    {
      name: 'Direct Costs (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      behavior: EExpenseAccountBehavior.DefaultDirectCost,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultRentAndUtilitiesAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '502000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.RentAndUtilities,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = rentAndUtilitiesAccountEntity.make(
    {
      name: 'Rent and Utilities (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultFinanceCostsAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '507000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.InterestAndFinanceCharges,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = financeCostsAccountEntity.make(
    {
      name: 'Finance Costs (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultTaxExpenseAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '508000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.IncomeTaxExpense,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = taxExpenseAccountEntity.make(
    {
      name: 'Tax Expense (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultUnrealizedLossAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '509000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.UnrealizedLoss,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = unrealizedLossAccountEntity.make(
    {
      name: 'Unrealized Loss (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

const makeDefaultAssetDisposalLossAccount: TExpenseHelper = async (
  params,
  repo,
  repoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;

  const accounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  const controlLedgerCode = '510000';
  const checkerPayload: ICanMakeAccountParams = {
    accountingEntityId,
    type: ELedgerType.Expense,
    subType: EExpenseSubType.LossOnAssetDisposal,
    controlLedgerCode,
  };

  const { canMake, controlAccount } = await canMakeAccount(
    checkerPayload,
    repo,
    repoOptions
  );

  if (!canMake) return accounts;

  const account = assetDisposalLossAccountEntity.make(
    {
      name: 'Asset Disposal Loss (Default)',
      createdBy: userId,
      accountingEntityId,
      currency: functionalCurrency,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: null,
    },
    controlLedgerCode
  );

  return [account];
};

export default function getIndividualPostingAccountsSetupHelpers(
  params: IParams,
  repo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) {
  return {
    makeDefaultServicesAccount: () =>
      makeDefaultServicesAccount(params, repo, repoOptions),
    makeDefaultEmploymentIncomeAccount: () =>
      makeDefaultEmploymentIncomeAccount(params, repo, repoOptions),
    makeDefaultGainOnAssetsAccount: () =>
      makeDefaultGainOnAssetsAccount(params, repo, repoOptions),
    makeDefaultUnrealizedGainsAccount: () =>
      makeDefaultUnrealizedGainsAccount(params, repo, repoOptions),
    makeDefaultDirectCostsAccount: () =>
      makeDefaultDirectCostsAccount(params, repo, repoOptions),
    makeDefaultRentAndUtilitiesAccount: () =>
      makeDefaultRentAndUtilitiesAccount(params, repo, repoOptions),
    makeDefaultFinanceCostsAccount: () =>
      makeDefaultFinanceCostsAccount(params, repo, repoOptions),
    makeDefaultTaxExpenseAccount: () =>
      makeDefaultTaxExpenseAccount(params, repo, repoOptions),
    makeDefaultUnrealizedLossAccount: () =>
      makeDefaultUnrealizedLossAccount(params, repo, repoOptions),
    makeDefaultAssetDisposalLossAccount: () =>
      makeDefaultAssetDisposalLossAccount(params, repo, repoOptions),
  };
}
