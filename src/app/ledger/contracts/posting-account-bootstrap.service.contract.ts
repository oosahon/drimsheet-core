import { IReadRepoOptions } from '@shared/types/repo.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

import { ILedgerAccountBootstrapResult } from '@app/ledger/contracts/ledger-account-bootstrap.types';

export default interface IPostingAccountBootstrapService {
  /**
   * Creates and persists the complete posting-account catalog in dependency
   * order. Joins the supplied transaction and propagates failures unchanged.
   */
  bootstrap(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions
  ): Promise<ILedgerAccountBootstrapResult>;
}
