import { IEvent, TAuditedEntity } from '../../../shared/types/event.types';
import { IEntityDelta } from '../../../shared/types/history.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ILedgerAccount } from './ledger.types';
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
    repoOptions: IReadRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: IRevenueLedgerAccount[];
    events: IEvent<IRevenueLedgerAccount>[];
    audits: IEntityDelta<ILedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: {
      servicesHeader: IServicesAccount;
      employmentIncomeHeader: IEmploymentIncomeAccount;
      gainOnAssetSaleHeader: IGainOnAssetSaleAccount;
      unrealizedGainHeader: IUnrealizedGainAccount;
    },
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      IRevenueLedgerAccount,
      IRevenueLedgerAccount,
      ILedgerAccount
    >[]
  >;
}
