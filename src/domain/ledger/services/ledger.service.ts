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
import equityAccountService from './equity-account.service';
import revenueAccountService from './revenue-account.service';
import expenseAccountService from './expense-account.service';

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
  const equityAccountServiceFn = equityAccountService(repo);
  const revenueAccountServiceFn = revenueAccountService(repo);
  const expenseAccountServiceFn = expenseAccountService(repo);

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

      const liabilityAccounts =
        await liabilityAccountServiceFn.setupBaseIndividualAccounts(
          entity,
          repoOptions
        );

      const equityAccounts =
        await equityAccountServiceFn.setupBaseIndividualAccounts(
          entity,
          repoOptions
        );

      const revenueAccounts =
        await revenueAccountServiceFn.setupBaseIndividualAccounts(
          entity,
          repoOptions
        );

      const expenseAccounts =
        await expenseAccountServiceFn.setupBaseIndividualAccounts(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountServiceFn.setupBaseIndividualAccounts(
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

      const liabilitySuspenseAccounts =
        await liabilityAccountServiceFn.bootstrapNonPowerUserAccounts(
          entity,
          repoOptions
        );

      const revenueSuspenseAccounts =
        await revenueAccountServiceFn.bootstrapNonPowerUserAccounts(
          entity,
          repoOptions
        );

      const expenseSuspenseAccounts =
        await expenseAccountServiceFn.bootstrapNonPowerUserAccounts(
          entity,
          repoOptions
        );

      const assetAccounts =
        await assetAccountServiceFn.bootstrapNonPowerUserAccounts(
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
