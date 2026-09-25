import { IHistory } from '@shared/values/history/types/history.types';

import { IActor } from '@domain/user/types/actor.types';

import { actorHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

function toRepo(
  history: IHistory<IActor>
): typeof actorHistoryInAudit.$inferInsert {
  return {
    actorEntityId: history.entityId,
    actorId: history.actorId,
    onBehalfOf: history.onBehalfOf,
    action: history.action,
    diff: history.diff,
    correlationId: history.correlationId,
    occurredAt: toRepoDate(history.occurredAt),
  };
}

export default Object.freeze({ toRepo });
