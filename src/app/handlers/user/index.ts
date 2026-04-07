import observability from '../../../infra/observability';
import userCreatedEventHandler from './user-created-event.handler';

const userEventHandlers = {
  created: userCreatedEventHandler(
    observability.reporter,
    observability.logger
  ),
};

export default userEventHandlers;
