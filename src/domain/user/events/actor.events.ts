import eventValue from '@shared/values/events/event.vo';

import { IActor } from '@domain/user/types/actor.types';

const EActorEvents = { Created: 'domain:actor:created' } as const;

function created(actor: IActor) {
  return eventValue.make({ type: EActorEvents.Created, data: actor });
}

export default Object.freeze({ created });
