import vars from '@infra/config/vars.config';
import observability from '@infra/observability';

import makeHttpErrorHandler from '@interface/http/handlers/error.handler';

const httpHandlers = {
  error: makeHttpErrorHandler({
    reporter: observability.reporter,
    logger: observability.logger,
    nodeEnv: vars.APP_ENV,
  }),
};

export default httpHandlers;
