import eventValue from '../../../shared/values/events/event.vo';
import { IUserPreferences } from '../types/user-preferences.types';
import { IUser } from '../types/user.types';

export const EUserEvents = {
  Created: 'domain:user:created',
  Updated: 'domain:user:updated',
  EmailVerified: 'domain:user:email-verified',
  PreferencesUpdated: 'domain:user:preferences-updated',
  LoggedIn: 'domain:user:logged-in',
  RequestedPasswordReset: 'domain:user:reset-password-requested',
  PasswordReset: 'domain:user:password-reset',
} as const;

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

function makeEmailVerifiedEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.EmailVerified,
    data: user,
  });
}

function makePreferencesUpdatedEvent(userPreferences: IUserPreferences) {
  return eventValue.make<IUserPreferences>({
    type: EUserEvents.PreferencesUpdated,
    data: userPreferences,
  });
}

function makeLoggedInEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.LoggedIn,
    data: user,
  });
}

function makeRequestedPasswordResetEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.RequestedPasswordReset,
    data: user,
  });
}

function makePasswordResetEvent(user: IUser) {
  return eventValue.make<IUser>({
    type: EUserEvents.PasswordReset,
    data: user,
  });
}

const userEvents = Object.freeze({
  created: makeCreatedEvent,
  updated: makeUpdatedEvent,
  emailVerified: makeEmailVerifiedEvent,
  preferencesUpdated: makePreferencesUpdatedEvent,
  loggedIn: makeLoggedInEvent,
  requestedPasswordReset: makeRequestedPasswordResetEvent,
  passwordReset: makePasswordResetEvent,
});

export default userEvents;
