import observability from '../../../infra/observability';
import makeHttpErrorHandler from './error.handler';

const httpHandlers = {
  error: makeHttpErrorHandler(observability.reporter),
};

export default httpHandlers;
