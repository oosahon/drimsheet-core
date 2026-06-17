import { IEvent } from '../../../shared/types/event.types';
import { IEntityDelta } from '../../../shared/types/history.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IEquityLedgerAccount } from './equity-account.types';
import { ILedgerAccount } from './ledger.types';

export default interface IEquityAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions
  ): Promise<{
    accounts: IEquityLedgerAccount[];
    events: IEvent<IEquityLedgerAccount>[];
    audits: IEntityDelta<ILedgerAccount>[];
  }>;
}
