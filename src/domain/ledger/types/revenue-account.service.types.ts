import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import {
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IRevenueLedgerAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from './revenue-account.types';

export default interface IRevenueAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: IRevenueLedgerAccount[];
    events: IEvent<IRevenueLedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: {
      servicesHeader: IServicesAccount;
      employmentIncomeHeader: IEmploymentIncomeAccount;
      gainOnAssetSaleHeader: IGainOnAssetSaleAccount;
      unrealizedGainHeader: IUnrealizedGainAccount;
    },
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IRevenueLedgerAccount, IRevenueLedgerAccount>[]>;
}
