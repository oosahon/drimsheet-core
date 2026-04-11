import observability from '../../../infra/observability';
import httpErrorHandler from './error.handler';

const httpHandlers = {
  error: httpErrorHandler(observability.reporter),
};

export default httpHandlers;
