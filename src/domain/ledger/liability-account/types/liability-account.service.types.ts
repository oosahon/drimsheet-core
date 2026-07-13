import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/events/types/event.types';
import { IEntityDelta } from '../../../../shared/history/types/history.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { ILedgerAccount } from '../../shared/types/ledger.types';
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
    audits: IEntityDelta<ILedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: { statutoryPayablesHeader: IStatutoryPayableAccount },
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      ILiabilityLedgerAccount,
      ILiabilityLedgerAccount,
      ILedgerAccount
    >[]
  >;
}
