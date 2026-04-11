import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { AppError } from '../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../accounting-entity/types/accounting-entity.types';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccount } from '../types/ledger.types';
import individualGLSetupHelpers from './individual-gl-setup.helpers';
import getIndividualPostingAccountsSetupHelpers from './individual-posting-accounts-setup.helpers';

export interface ILedgerService {
  setupBaseIndividualAccounts(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;

  bootstrapNonPowerUserPostingAccounts(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;
}

export default function ledgerService(
  repo: ILedgerAccountRepo
): ILedgerService {
  return {
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
     *        - Services: 401000
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
    async setupBaseIndividualAccounts(entity, repoOptions) {
      if (entity.type !== EAccountingEntityType.Individual) {
        throw new AppError('Entity is not an individual', { cause: entity });
      }

      const params = {
        userId: entity.ownerId,
        accountingEntityId: entity.id,
        functionalCurrency: entity.functionalCurrency,
      };

      const {
        makeBaseAssetAccounts,
        makeBaseLiabilityAccounts,
        makeBaseEquityAccounts,
        makeBaseRevenueAccounts,
        makeBaseExpenseAccounts,
      } = individualGLSetupHelpers(params, repo, repoOptions);

      const assetAccounts = await makeBaseAssetAccounts();
      const liabilityAccounts = await makeBaseLiabilityAccounts();
      const equityAccounts = await makeBaseEquityAccounts();
      const revenueAccounts = await makeBaseRevenueAccounts();
      const expenseAccounts = await makeBaseExpenseAccounts();

      const entitiesAndEvents = [
        ...assetAccounts,
        ...liabilityAccounts,
        ...equityAccounts,
        ...revenueAccounts,
        ...expenseAccounts,
      ];

      return entitiesAndEvents;
    },

    /**
     * Sets up the following general ledger accounts for a non-power user:
     *    - Assets:
     *        - Asset Suspense Account: 199000
     *    - Liabilities:
     *        - Liability Suspense Account: 299000
     *    - Revenue:
     *        - Services (Default): 401001
     *        - Employment Income (Default): 403001
     *        - Gain on assets (Default): 405001
     *        - Unrealized Gains (Default): 406001
     *    - Expenses:
     *        - Direct Costs (Default): 500001
     *        - Rent and Utilities (Default): 502001
     *        - Finance Costs (Default): 507001
     *        - Tax Expense (Default): 508001
     *        - Unrealized Loss (FX) (Default): 509001
     *        - Asset Disposal Loss (Default): 510001
     */
    async bootstrapNonPowerUserPostingAccounts(entity, repoOptions) {
      if (entity.type !== EAccountingEntityType.Individual) {
        throw new AppError('Entity is not an individual', { cause: entity });
      }

      const params = {
        userId: entity.ownerId,
        accountingEntityId: entity.id,
        functionalCurrency: entity.functionalCurrency,
      };

      const {
        makeAssetSuspenseAccount,
        makeLiabilitySuspenseAccount,
        makeDefaultServicesAccount,
        makeDefaultEmploymentIncomeAccount,
        makeDefaultGainOnAssetsAccount,
        makeDefaultUnrealizedGainsAccount,
        makeDefaultDirectCostsAccount,
        makeDefaultRentAndUtilitiesAccount,
        makeDefaultFinanceCostsAccount,
        makeDefaultTaxExpenseAccount,
        makeDefaultUnrealizedLossAccount,
        makeDefaultAssetDisposalLossAccount,
      } = getIndividualPostingAccountsSetupHelpers(params, repo, repoOptions);

      const assetSuspenseAccounts = await makeAssetSuspenseAccount();
      const liabilitySuspenseAccounts = await makeLiabilitySuspenseAccount();
      const servicesAccounts = await makeDefaultServicesAccount();
      const employmentIncomeAccounts =
        await makeDefaultEmploymentIncomeAccount();
      const gainOnAssetsAccounts = await makeDefaultGainOnAssetsAccount();
      const unrealizedGainsAccounts = await makeDefaultUnrealizedGainsAccount();
      const directCostsAccounts = await makeDefaultDirectCostsAccount();
      const rentAndUtilitiesAccounts =
        await makeDefaultRentAndUtilitiesAccount();
      const financeCostsAccounts = await makeDefaultFinanceCostsAccount();
      const taxExpenseAccounts = await makeDefaultTaxExpenseAccount();
      const unrealizedLossAccounts = await makeDefaultUnrealizedLossAccount();
      const assetDisposalLossAccounts =
        await makeDefaultAssetDisposalLossAccount();

      return [
        ...assetSuspenseAccounts,
        ...liabilitySuspenseAccounts,
        ...servicesAccounts,
        ...employmentIncomeAccounts,
        ...gainOnAssetsAccounts,
        ...unrealizedGainsAccounts,
        ...directCostsAccounts,
        ...rentAndUtilitiesAccounts,
        ...financeCostsAccounts,
        ...taxExpenseAccounts,
        ...unrealizedLossAccounts,
        ...assetDisposalLossAccounts,
      ];
    },
  };
}
