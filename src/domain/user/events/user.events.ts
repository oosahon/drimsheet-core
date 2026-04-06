import eventValue from '../../../shared/value-objects/event.vo';
import { IUser } from '../types/user.types';

export enum EUserEvents {
  Created = 'domain:user:created',
  Updated = 'domain:user:updated',
  Deleted = 'domain:user:deleted',
  EmailVerified = 'domain:user:email-verified',
}

function makeCreatedEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.Created,
    data: user,
  });
}

function makeUpdatedEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.Updated,
    data: user,
  });
}

function makeDeletedEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.Deleted,
    data: user,
  });
}

function makeEmailVerifiedEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.EmailVerified,
    data: user,
  });
}

const userEvents = Object.freeze({
  created: makeCreatedEvent,
  updated: makeUpdatedEvent,
  deleted: makeDeletedEvent,
  emailVerified: makeEmailVerifiedEvent,
});

export default userEvents;
