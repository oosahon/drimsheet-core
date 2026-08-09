import { IReadRepoOptions } from '@shared/types/repo.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

import { ILedgerAccountBootstrapResult } from '@app/ledger/contracts/ledger-account-bootstrap.types';

export default interface IHeaderAccountsBootstrapService {
  /** Rejects immediately when any domain account creation rejects. */
  bootstrap(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions
  ): Promise<ILedgerAccountBootstrapResult>;
}
