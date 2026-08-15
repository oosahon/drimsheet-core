import IReporter from '@shared/contracts/reporter.contract';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';

import { EUserEvents } from '@domain/user/events/user.events';
import { IUser } from '@domain/user/types/user.types';

import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  reporter: IReporter;
  appContext: IAppContext;
}

function makeUserEmailVerifiedEventHandler(deps: IDependencies) {
  return async (event: IEvent<IUser>) => {
    eventValue.validateEventTypeMatch(event, EUserEvents.EmailVerified);

    // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
  };
}

export default makeUserEmailVerifiedEventHandler;
