import { TEntityId } from '@shared/types/uuid';
import deepFreeze from '@shared/utils/deep-freeze';

import { IActor } from '@domain/user/types/actor.types';

import { actorsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';

type TActorModel = typeof actorsInCore.$inferSelect;

function toRepo(actor: IActor): TActorModel {
  return {
    id: actor.id,
    type: actor.type,
    username: actor.username,
    displayName: actor.displayName,
    ownerActorId: actor.ownerActorId,
    agentName: actor.agentName,
    status: actor.status,
    createdBy: actor.createdBy,
    version: actor.version,
    createdAt: toRepoDate(actor.createdAt),
    updatedAt: toRepoDate(actor.updatedAt),
  };
}

function toDomain(actor: TActorModel): IActor {
  return deepFreeze({
    id: actor.id as TEntityId,
    type: actor.type as IActor['type'],
    username: actor.username,
    displayName: actor.displayName,
    ownerActorId: actor.ownerActorId as TEntityId | null,
    agentName: actor.agentName,
    status: actor.status as IActor['status'],
    createdBy: actor.createdBy as TEntityId,
    version: actor.version,
    createdAt: fromRepoDate(actor.createdAt),
    updatedAt: fromRepoDate(actor.updatedAt),
  });
}

export default Object.freeze({ toRepo, toDomain });
