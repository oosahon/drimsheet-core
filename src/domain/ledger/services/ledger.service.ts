import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../currency/types/currency.types';
import cashAndEquivalentAccountEntity from '../entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../entities/01-asset-account/02-receivables.entity';
import shortTermLoanAccountEntity from '../entities/02-liability-account/00-short-term-loan.entity';
import payableAccountEntity from '../entities/02-liability-account/03-payables.entity';
import retainedEarningAccountEntity from '../entities/03-equity-account/01-retained-earning.entity';
import openingBalanceEquityLedgerEntity from '../entities/03-equity-account/99-opening-balance.equity';
import servicesAccountEntity from '../entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../entities/04-revenue-account/04-employment-income.entity';
import gainOnSaleAccountEntity from '../entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../entities/04-revenue-account/07-unrealized-gain.entity';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import financeCostsAccountEntity from '../entities/05-expense-account/07-finance-costs.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/08-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/09-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/10-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  EAssetAccountBehavior,
  IAssetLedgerAccount,
} from '../types/asset-account.types';
import { IEquityLedgerAccount } from '../types/equity-account.types';
import {
  EExpenseAccountBehavior,
  IExpenseLedgerAccount,
} from '../types/expense-account.types';
import { EAdjunctAccountRule, EContraAccountRule } from '../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ILiabilityLedgerAccount,
} from '../types/liability-account.types';
import { IRevenueLedgerAccount } from '../types/revenue-account.types';

interface IBaseIndividualAccountsCreationParams {
  userId: TEntityId;
  accountingEntityId: TEntityId;
  functionalCurrency: ICurrency;
}

const makeBaseAssetAccounts = async (
  params: IBaseIndividualAccountsCreationParams,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;
  // ========== Assets ==========
  const assetAccounts: TEntityWithEvents<
    IAssetLedgerAccount,
    IAssetLedgerAccount
  >[] = [];

  // ========== Cash and Cash Equivalents ==========
  const existingCashAndEquivalentsAccount = await ledgerAccountRepo.findByCode(
    '100000',
    accountingEntityId,
    repoOptions
  );
  if (!existingCashAndEquivalentsAccount) {
    const cashAndCashEquivalentsAccount = cashAndEquivalentAccountEntity.make(
      {
        name: 'Cash and Cash Equivalents',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
      },
      null
    );

    assetAccounts.push(cashAndCashEquivalentsAccount);
  }

  // ========== Receivables ==========
  const existingReceivables = await ledgerAccountRepo.findByCode(
    '102000',
    accountingEntityId,
    repoOptions
  );
  if (!existingReceivables) {
    const receivablesAccount = receivablesAccountEntity.make(
      {
        name: 'Receivables',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultReceivables,
        contraAccountRule: EContraAccountRule.ContraPermitted,
        adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
        meta: null,
      },
      null
    );

    assetAccounts.push(receivablesAccount);
  }

  return assetAccounts;
};
const makeBaseLiabilityAccounts = async (
  params: IBaseIndividualAccountsCreationParams,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;
  // ========== Liabilities ==========
  const liabilityAccounts: TEntityWithEvents<
    ILiabilityLedgerAccount,
    ILiabilityLedgerAccount
  >[] = [];

  // ============ Short term debts ============
  const existingShortTermDebts = await ledgerAccountRepo.findByCode(
    '200000',
    accountingEntityId,
    repoOptions
  );
  if (!existingShortTermDebts) {
    const shortTermDebtsAccount = shortTermLoanAccountEntity.make(
      {
        name: 'Short Term Debts',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        behavior: ELiabilityAccountBehavior.DefaultShortTermDebt,
        meta: null,
      },
      null
    );
    liabilityAccounts.push(shortTermDebtsAccount);
  }

  // ========== Payables ==========
  let payablesAccountId: TEntityId;
  const existingPayables = await ledgerAccountRepo.findByCode(
    '201000',
    accountingEntityId,
    repoOptions
  );
  if (!existingPayables) {
    const payablesAccount = payableAccountEntity.make(
      {
        name: 'Payables',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        behavior: ELiabilityAccountBehavior.DefaultPayable,
        meta: null,
        contraAccountRule: EContraAccountRule.ContraPermitted,
        adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      },
      null
    );
    payablesAccountId = payablesAccount[0].id;
    liabilityAccounts.push(payablesAccount);
  } else {
    payablesAccountId = existingPayables.id;
  }
  return liabilityAccounts;
};
const makeBaseEquityAccounts = async (
  params: IBaseIndividualAccountsCreationParams,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;
  const equityAccounts: TEntityWithEvents<
    IEquityLedgerAccount,
    IEquityLedgerAccount
  >[] = [];

  // ========== Retained Earnings ==========
  const existingRetainedEarnings = await ledgerAccountRepo.findByCode(
    '301000',
    accountingEntityId,
    repoOptions
  );
  if (!existingRetainedEarnings) {
    const retainedEarningsAccount = retainedEarningAccountEntity.make(
      {
        name: 'Retained Earnings',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
      },
      null
    );
    equityAccounts.push(retainedEarningsAccount);
  }

  // ========== Opening Balance Equity ==========
  const existingOpeningBalanceEquity = await ledgerAccountRepo.findByCode(
    '399000',
    accountingEntityId,
    repoOptions
  );
  if (!existingOpeningBalanceEquity) {
    const openingBalanceEquityAccount = openingBalanceEquityLedgerEntity.make(
      {
        name: 'Opening Balance Equity',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
      },
      null
    );
    equityAccounts.push(openingBalanceEquityAccount);
  }

  return equityAccounts;
};
const makeBaseRevenueAccounts = async (
  params: IBaseIndividualAccountsCreationParams,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;
  const revenueAccounts: TEntityWithEvents<
    IRevenueLedgerAccount,
    IRevenueLedgerAccount
  >[] = [];

  // ========== Services (401000) ==========
  const existingServices = await ledgerAccountRepo.findByCode(
    '401000',
    accountingEntityId,
    repoOptions
  );
  if (!existingServices) {
    const servicesAccount = servicesAccountEntity.make(
      {
        name: 'Services',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    revenueAccounts.push(servicesAccount);
  }

  // ========== Employment Income (403000) ==========
  const existingEmploymentIncome = await ledgerAccountRepo.findByCode(
    '403000',
    accountingEntityId,
    repoOptions
  );
  if (!existingEmploymentIncome) {
    const employmentIncomeAccount = employmentIncomeAccountEntity.make(
      {
        name: 'Employment Income',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    revenueAccounts.push(employmentIncomeAccount);
  }

  // ========== Gain on Sale of Assets (405000) ==========
  const existingGainOnSaleOfAssets = await ledgerAccountRepo.findByCode(
    '405000',
    accountingEntityId,
    repoOptions
  );
  if (!existingGainOnSaleOfAssets) {
    const gainOnSaleOfAssetsAccount = gainOnSaleAccountEntity.make(
      {
        name: 'Gain on Sale of Assets',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    revenueAccounts.push(gainOnSaleOfAssetsAccount);
  }

  // ========== Unrealized Gain (406000) ==========
  const existingUnrealizedGain = await ledgerAccountRepo.findByCode(
    '406000',
    accountingEntityId,
    repoOptions
  );
  if (!existingUnrealizedGain) {
    const unrealizedGainAccount = unrealizedGainAccountEntity.make(
      {
        name: 'Unrealized Gain',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    revenueAccounts.push(unrealizedGainAccount);
  }

  return revenueAccounts;
};
const makeBaseExpenseAccounts = async (
  params: IBaseIndividualAccountsCreationParams,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) => {
  const { userId, accountingEntityId, functionalCurrency } = params;
  const expenseAccounts: TEntityWithEvents<
    IExpenseLedgerAccount,
    IExpenseLedgerAccount
  >[] = [];

  // ========== Direct Costs (500000) ==========
  const existingDirectCosts = await ledgerAccountRepo.findByCode(
    '500000',
    accountingEntityId,
    repoOptions
  );
  if (!existingDirectCosts) {
    const directCostsAccount = directCostsAccountEntity.make(
      {
        name: 'Direct Costs',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        behavior: EExpenseAccountBehavior.DefaultDirectCost,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(directCostsAccount);
  }

  // ========== Rent and Utilities (502000) ==========
  const existingRentAndUtilities = await ledgerAccountRepo.findByCode(
    '502000',
    accountingEntityId,
    repoOptions
  );
  if (!existingRentAndUtilities) {
    const rentAndUtilitiesAccount = rentAndUtilitiesAccountEntity.make(
      {
        name: 'Rent and Utilities',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(rentAndUtilitiesAccount);
  }

  // ========== Finance Costs (507000) ==========
  const existingFinanceCosts = await ledgerAccountRepo.findByCode(
    '507000',
    accountingEntityId,
    repoOptions
  );
  if (!existingFinanceCosts) {
    const financeCostsAccount = financeCostsAccountEntity.make(
      {
        name: 'Finance Costs',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(financeCostsAccount);
  }

  // ========== Tax Expense (508000) ==========
  const existingTaxExpense = await ledgerAccountRepo.findByCode(
    '508000',
    accountingEntityId,
    repoOptions
  );
  if (!existingTaxExpense) {
    const taxExpenseAccount = taxExpenseAccountEntity.make(
      {
        name: 'Tax Expense',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(taxExpenseAccount);
  }

  // ========== Unrealized Loss (FX) (509000) ==========
  const existingUnrealizedLoss = await ledgerAccountRepo.findByCode(
    '509000',
    accountingEntityId,
    repoOptions
  );
  if (!existingUnrealizedLoss) {
    const unrealizedLossAccount = unrealizedLossAccountEntity.make(
      {
        name: 'Unrealized Loss (FX)',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(unrealizedLossAccount);
  }

  // ========== Asset Disposal Loss (510000) ==========
  const existingAssetDisposalLoss = await ledgerAccountRepo.findByCode(
    '510000',
    accountingEntityId,
    repoOptions
  );
  if (!existingAssetDisposalLoss) {
    const assetDisposalLossAccount = assetDisposalLossAccountEntity.make(
      {
        name: 'Asset Disposal Loss',
        createdBy: userId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: true,
        controlAccountId: null,
        meta: null,
      },
      null
    );
    expenseAccounts.push(assetDisposalLossAccount);
  }

  return expenseAccounts;
};

export default function ledgerService(ledgerAccountRepo: ILedgerAccountRepo) {
  return Object.freeze({
    /**
     * Sets up the following general ledger accounts for an individual:
     *    - Assets:
     *        - Cash and Cash Equivalents: 100000
     *        - Receivables (Tax Credits): 102000
     *    - Liabilities:
     *        - Short Term Loan (Overdraft): 200000
     *        - Payables (Tax Obligations): 201000
     *    - Equity:
     *        - Retained Earnings: 301000
     *        - Opening Balance Equity: 399000
     *    - Revenue:
     *        - Services (Freelance): 401000
     *        - Employment Income: 403000
     *        - Gain on Sale of Assets: 405000
     *        - Unrealized Gain (FX): 406000
     *    - Expenses:
     *        - Direct Costs: 500000
     *        - Rent and Utilities: 502000
     *        - Finance Costs: 507000
     *        - Tax Expense: 508000
     *        - Unrealized Loss (FX): 509000
     *        - Asset Disposal Loss: 510000
     */
    async setupBaseIndividualAccounts(
      params: IBaseIndividualAccountsCreationParams,
      repoOptions: IRepoOptions
    ) {
      const assetAccounts = await makeBaseAssetAccounts(
        params,
        ledgerAccountRepo,
        repoOptions
      );
      const liabilityAccounts = await makeBaseLiabilityAccounts(
        params,
        ledgerAccountRepo,
        repoOptions
      );
      const equityAccounts = await makeBaseEquityAccounts(
        params,
        ledgerAccountRepo,
        repoOptions
      );
      const revenueAccounts = await makeBaseRevenueAccounts(
        params,
        ledgerAccountRepo,
        repoOptions
      );
      const expenseAccounts = await makeBaseExpenseAccounts(
        params,
        ledgerAccountRepo,
        repoOptions
      );

      const entitiesAndEvents = [
        ...assetAccounts,
        ...liabilityAccounts,
        ...equityAccounts,
        ...revenueAccounts,
        ...expenseAccounts,
      ];

      return entitiesAndEvents;
    },
  });
}
