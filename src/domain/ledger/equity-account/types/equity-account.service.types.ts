import { IEvent } from '../../../../shared/types/event.types';
import { IEntityDelta } from '../../../../shared/types/history.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { ILedgerAccount } from '../../shared/types/ledger.types';
import { IEquityLedgerAccount } from './equity-account.types';

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
