import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

export default interface IOutboxService {
  createBalancePropagation(
    journalEntryId: TEntityId,
    options: IWriteRepoOptions
  ): Promise<void>;
}
