import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

import { ILedgerAccountBootstrapResult } from '@app/ledger/contracts/ledger-account-bootstrap.types';

export default interface ISuspenseAccountBootstrapService {
  /** Rejects immediately when either domain suspense creation rejects. */
  bootstrap(
    accountingEntity: IAccountingEntity,
    createdBy: TEntityId,
    repoOptions: IReadRepoOptions
  ): Promise<ILedgerAccountBootstrapResult>;
}
