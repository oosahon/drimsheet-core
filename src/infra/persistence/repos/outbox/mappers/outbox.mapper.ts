import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import {
  ICreateOutbox,
  IOutbox,
  UOutboxType,
} from '@app/outbox/types/outbox.types';

import { outboxInCore } from '@infra/config/drizzle/schema';
import { fromRepoDate } from '@infra/persistence/helpers/date.mapper';

export type IOutboxRepoModel = InferSelectModel<typeof outboxInCore>;
export type ICreateOutboxRepoModel = InferInsertModel<typeof outboxInCore>;

const outboxMapper = {
  toRepo(outbox: ICreateOutbox): ICreateOutboxRepoModel {
    return {
      id: outbox.id,
      correlationId: outbox.correlationId,
      type: outbox.type,
      data: outbox.data,
    };
  },

  toDomain(outbox: IOutboxRepoModel): IOutbox {
    return {
      id: outbox.id as TEntityId,
      correlationId: outbox.correlationId,
      type: outbox.type as UOutboxType,
      data: outbox.data,
      createdAt: fromRepoDate(outbox.createdAt),
    };
  },
};

export default outboxMapper;
