import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { AppError } from '../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../accounting-entity/types/accounting-entity.types';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccount } from '../types/ledger.types';
import assetAccountService from './asset-account.service';
import liabilityAccountService from './liability-account.service';
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
  const assetAccountServiceFn = assetAccountService(repo);
  const liabilityAccountServiceFn = liabilityAccountService(repo);

  return {
    /**
     * Sets up the following general ledger accounts for an individual:
     *    - Assets
     *    - Liabilities
     *    - Equity
     *    - Revenue
     *    - Expenses
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
        makeBaseEquityAccounts,
        makeBaseRevenueAccounts,
        makeBaseExpenseAccounts,
      } = individualGLSetupHelpers(params, repo, repoOptions);

      const liabilityAccounts =
        await liabilityAccountServiceFn.setupBaseIndividualAccounts(
          entity,
          repoOptions
        );
      const equityAccounts = await makeBaseEquityAccounts();
      const revenueAccounts = await makeBaseRevenueAccounts();
      const expenseAccounts = await makeBaseExpenseAccounts();

      const assetAccounts =
        await assetAccountServiceFn.setupBaseIndividualAccounts(
          entity,
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

    /**
     * Sets up the following general ledger accounts for a non-power user:
     *    - Assets
     *    - Liabilities
     *    - Revenue
     *    - Expenses
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

      const liabilitySuspenseAccounts =
        await liabilityAccountServiceFn.bootstrapNonPowerUserAccounts(
          entity,
          repoOptions
        );
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

      const assetAccounts =
        await assetAccountServiceFn.bootstrapNonPowerUserAccounts(
          entity,
          repoOptions
        );

      return [
        ...assetAccounts,
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
