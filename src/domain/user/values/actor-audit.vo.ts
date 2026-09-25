import deepFreeze from '@shared/utils/deep-freeze';
import { IEntityDelta } from '@shared/values/history/types/history.types';

import actorValidation from '@domain/user/entities/validations/actor.validation';
import { IActor } from '@domain/user/types/actor.types';

function created(actor: IActor): IEntityDelta<IActor> {
  actorValidation.validate(actor);
  return deepFreeze({
    entityId: actor.id,
    entityVersion: actor.version,
    action: 'created',
    diff: { before: null, after: actor },
    occurredAt: actor.createdAt,
  });
}

export default Object.freeze({ created });
