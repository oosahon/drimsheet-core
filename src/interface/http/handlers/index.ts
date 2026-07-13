import { NODE_ENV } from '../../../infra/config/vars.config';
import observability from '../../../infra/observability';
import makeHttpErrorHandler from './error.handler';

const httpHandlers = {
  error: makeHttpErrorHandler({
    reporter: observability.reporter,
    logger: observability.logger,
    nodeEnv: NODE_ENV,
  }),
};

export default httpHandlers;
