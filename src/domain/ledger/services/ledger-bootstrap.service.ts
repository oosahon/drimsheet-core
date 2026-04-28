import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { AppError } from '../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../accounting-entity/types/accounting-entity.types';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccount } from '../types/ledger.types';
import makeAssetAccountBootstrapService from './asset-account-bootstrap.service';
import makeEquityAccountBootstrapService from './equity-account-bootstrap.service';
import makeExpenseAccountBootstrapService from './expense-account-bootstrap.service';
import makeLiabilityAccountBootstrapService from './liability-account-bootstrap.service';
import makeRevenueAccountBootstrapService from './revenue-account-bootstrap.service';

export interface ILedgerAccountBootstrapService {
  bootstrapIndividualHeaderAccounts(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;

  bootstrapPostingAccounts(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;
}

export default function makeLedgerBootstrapService(
  repo: ILedgerAccountRepo
): ILedgerAccountBootstrapService {
  const assetAccountBootstrapService = makeAssetAccountBootstrapService(repo);
  const liabilityAccountBootstrapService =
    makeLiabilityAccountBootstrapService(repo);
  const equityAccountBootstrapService = makeEquityAccountBootstrapService(repo);
  const revenueAccountBootstrapService =
    makeRevenueAccountBootstrapService(repo);
  const expenseAccountBootstrapService =
    makeExpenseAccountBootstrapService(repo);

  return {
    /**
     * Sets up the following header accounts for an individual:
     *    - Assets
     *    - Liabilities
     *    - Equity
     *    - Revenue
     *    - Expenses
     */
    async bootstrapIndividualHeaderAccounts(entity, repoOptions) {
      if (entity.type !== EAccountingEntityType.Individual) {
        throw new AppError('Entity is not an individual', { cause: entity });
      }

      const liabilityAccounts =
        await liabilityAccountBootstrapService.bootstrapIndividualHeaderAccounts(
          entity,
          repoOptions
        );

      const equityAccounts =
        await equityAccountBootstrapService.bootstrapIndividualHeaderAccounts(
          entity,
          repoOptions
        );

      const revenueAccounts =
        await revenueAccountBootstrapService.bootstrapIndividualHeaderAccounts(
          entity,
          repoOptions
        );

      const expenseAccounts =
        await expenseAccountBootstrapService.bootstrapIndividualHeaderAccounts(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountBootstrapService.bootstrapIndividualHeaderAccounts(
          entity,
          repoOptions
        );

      return [
        ...assetAccounts,
        ...liabilityAccounts,
        ...equityAccounts,
        ...revenueAccounts,
        ...expenseAccounts,
      ];
    },

    /**
     * Sets up the following posting (sub) accounts for a non-power user:
     *    - Assets
     *    - Liabilities
     *    - Revenue
     *    - Expenses
     */
    async bootstrapPostingAccounts(entity, repoOptions) {
      if (entity.type !== EAccountingEntityType.Individual) {
        throw new AppError('Entity is not an individual', { cause: entity });
      }

      const liabilitySuspenseAccounts =
        await liabilityAccountBootstrapService.bootstrapIndividualPostingAccounts(
          entity,
          repoOptions
        );

      const revenueSuspenseAccounts =
        await revenueAccountBootstrapService.bootstrapIndividualPostingAccounts(
          entity,
          repoOptions
        );

      const expenseSuspenseAccounts =
        await expenseAccountBootstrapService.bootstrapIndividualPostingAccounts(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountBootstrapService.bootstrapIndividualPostingAccounts(
          entity,
          repoOptions
        );

      return [
        ...assetAccounts,
        ...liabilitySuspenseAccounts,
        ...revenueSuspenseAccounts,
        ...expenseSuspenseAccounts,
      ];
    },
  };
}
