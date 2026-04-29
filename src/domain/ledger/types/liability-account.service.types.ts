import { IEvent } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { ILiabilityLedgerAccount } from './liability-account.types';

export default interface ILiabilityAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<{
    accounts: ILiabilityLedgerAccount[];
    events: IEvent<ILiabilityLedgerAccount>[];
  }>;
}
