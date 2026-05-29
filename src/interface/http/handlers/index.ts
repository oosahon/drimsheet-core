import { NODE_ENV } from '../../../infra/config/vars.config';
import observability from '../../../infra/observability';
import makeHttpErrorHandler from './error.handler';

const httpHandlers = {
  error: makeHttpErrorHandler(
    observability.reporter,
    observability.logger,
    NODE_ENV
  ),
};

export default httpHandlers;
