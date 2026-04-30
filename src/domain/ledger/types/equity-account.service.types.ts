import { IEvent } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IEquityLedgerAccount } from './equity-account.types';

export default interface IEquityAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<{
    accounts: IEquityLedgerAccount[];
    events: IEvent<IEquityLedgerAccount>[];
  }>;
}
