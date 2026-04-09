import observability from '../../../infra/observability';
import httpErrorHandler from './error.handler';

const httpHandlers = {
  error: httpErrorHandler(observability.logger, observability.reporter),
};

export default httpHandlers;
