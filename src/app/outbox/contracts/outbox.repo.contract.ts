import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import {
  ICreateOutbox,
  IOutbox,
  UOutboxType,
} from '@app/outbox/types/outbox.types';

export default interface IOutboxRepo {
  create(outbox: ICreateOutbox, options: IWriteRepoOptions): Promise<void>;

  findByIdAndType(
    id: TEntityId,
    type: UOutboxType,
    options: IReadRepoOptions
  ): Promise<IOutbox | null>;

  delete(id: TEntityId, options: IWriteRepoOptions): Promise<boolean>;
}
