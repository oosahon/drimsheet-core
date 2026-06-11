import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import {
  ILiabilityLedgerAccount,
  IStatutoryPayableAccount,
} from './liability-account.types';

export default interface ILiabilityAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: ILiabilityLedgerAccount[];
    events: IEvent<ILiabilityLedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: { statutoryPayablesHeader: IStatutoryPayableAccount },
    repoOptions: IReadRepoOptions
  ): Promise<
    TEntityWithEvents<ILiabilityLedgerAccount, ILiabilityLedgerAccount>[]
  >;
}
