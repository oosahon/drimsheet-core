import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { IEvent } from '../../../shared/events/types/event.types';
import { IEntityDelta } from '../../../shared/history/types/history.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

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
