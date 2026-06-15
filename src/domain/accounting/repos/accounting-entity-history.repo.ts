import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntityAuditHistory } from '../types/accounting-entity-audit.types';
import { IAccountingEntity } from '../types/accounting-entity.types';

export default interface IAccountingEntityHistoryRepo {
  save(
    entity: IAccountingEntity,
    history: IAccountingEntityAuditHistory,
    options: IWriteRepoOptions
  ): Promise<void>;
}
