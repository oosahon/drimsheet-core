import observability from '../../../infra/observability';
import appContext from '../../context';
import userCreatedEventHandler from './user-created-event.handler';

const userEventHandlers = {
  created: userCreatedEventHandler(
    observability.reporter,
    observability.logger,
    appContext.request
  ),
};

export default userEventHandlers;
