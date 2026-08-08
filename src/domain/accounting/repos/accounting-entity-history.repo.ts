import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IAccountingEntityAuditHistory } from '@domain/accounting/types/accounting-entity-audit.types';
import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

export default interface IAccountingEntityHistoryRepo {
  save(
    entity: IAccountingEntity,
    history: IAccountingEntityAuditHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
