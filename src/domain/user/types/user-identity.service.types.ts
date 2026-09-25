import { TCreationOmits } from '@shared/types/creation-omits.types';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import { IActor } from './actor.types';
import { IUser } from './user.types';

export default interface IUserIdentityService {
  create(payload: TCreationOmits<IUser, 'actorId' | 'createdBy'>): {
    actor: TAuditedEntity<IActor, IActor, IActor>;
    user: TAuditedEntity<IUser, IUser, IUser>;
  };
}
