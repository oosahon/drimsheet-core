import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IEvent } from '../../../shared/values/events/types/event.types';
import { IEntityDelta } from '../../../shared/values/history/types/history.types';

export interface IAccountsBootstrapResult {
  entries: {
    account: ILedgerAccount;
    audit: IEntityDelta<ILedgerAccount>;
  }[];
  events: IEvent<unknown>[];
}

export default interface IAccountsBootstrapService {
  bootstrap(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions,
    shouldBootstrapPostingAccounts: boolean
  ): Promise<IAccountsBootstrapResult>;
}
