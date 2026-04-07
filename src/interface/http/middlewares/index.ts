import appContext from '../../../app/context';
import logger from '../../../infra/observability/logger';
import reporter from '../../../infra/observability/reporter';
import errorHandlerMiddleware from './error-handler.middleware';

import isOptionalAuthenticatedUserMiddleware from './is-optional-authenticated-user.middleware';
import requestContextMiddleware from './request-context.middleware';

const middlewares = {
  isOptionalAuthenticatedUser: isOptionalAuthenticatedUserMiddleware(
    logger,
    reporter
  ),

  requestContext: requestContextMiddleware(appContext.request),

  errorHandler: errorHandlerMiddleware(logger, reporter),
};

export default middlewares;
