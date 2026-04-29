import { IEvent } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IRevenueLedgerAccount } from './revenue-account.types';

export default interface IRevenueAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<{
    accounts: IRevenueLedgerAccount[];
    events: IEvent<IRevenueLedgerAccount>[];
  }>;
}
