import eventValue from '../../../shared/value-objects/event.vo';
import { IUser } from '../types/user.types';

export const EUserEvents = {
  Created: 'domain:user:created',
  Updated: 'domain:user:updated',
  Deleted: 'domain:user:deleted',
  EmailVerified: 'domain:user:email-verified',
} as const;

export const userEventDescriptions: Record<string, string> = {
  [EUserEvents.Created]: 'Signed up to Purple Ledger.',
  [EUserEvents.Updated]: 'Updated profile information.',
  [EUserEvents.Deleted]: 'Deleted account.',
  [EUserEvents.EmailVerified]: 'Verified email address.',
};

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
