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
import equityAccountService from './equity-account.service';
import expenseAccountService from './expense-account.service';
import liabilityAccountService from './liability-account.service';
import revenueAccountService from './revenue-account.service';

export interface ILedgerService {
  makeHeaderAccountsForIndividuals(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;

  bootstrapPostingAccounts(
    entity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;
}

export default function ledgerService(
  repo: ILedgerAccountRepo
): ILedgerService {
  const assetAccountServiceFn = assetAccountService(repo);
  const liabilityAccountServiceFn = liabilityAccountService(repo);
  const equityAccountServiceFn = equityAccountService(repo);
  const revenueAccountServiceFn = revenueAccountService(repo);
  const expenseAccountServiceFn = expenseAccountService(repo);

  return {
    /**
     * Sets up the following header accounts for an individual:
     *    - Assets
     *    - Liabilities
     *    - Equity
     *    - Revenue
     *    - Expenses
     */
    async makeHeaderAccountsForIndividuals(entity, repoOptions) {
      if (entity.type !== EAccountingEntityType.Individual) {
        throw new AppError('Entity is not an individual', { cause: entity });
      }

      const liabilityAccounts =
        await liabilityAccountServiceFn.makeHeaderAccountsForIndividuals(
          entity,
          repoOptions
        );

      const equityAccounts =
        await equityAccountServiceFn.makeHeaderAccountsForIndividuals(
          entity,
          repoOptions
        );

      const revenueAccounts =
        await revenueAccountServiceFn.makeHeaderAccountsForIndividuals(
          entity,
          repoOptions
        );

      const expenseAccounts =
        await expenseAccountServiceFn.makeHeaderAccountsForIndividuals(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountServiceFn.makeHeaderAccountsForIndividuals(
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
        await liabilityAccountServiceFn.makePostingAccountsForIndividuals(
          entity,
          repoOptions
        );

      const revenueSuspenseAccounts =
        await revenueAccountServiceFn.makePostingAccountsForIndividuals(
          entity,
          repoOptions
        );

      const expenseSuspenseAccounts =
        await expenseAccountServiceFn.makePostingAccountsForIndividuals(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountServiceFn.makePostingAccountsForIndividuals(
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
