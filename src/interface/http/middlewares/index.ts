import appContext from '../../../app/context';
import logger from '../../../infra/observability/logger';
import reporter from '../../../infra/observability/reporter';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import errorHandlerMiddleware from './error-handler.middleware';
import isAuthenticatedUserMiddleware from './is-authenticated-user.middleware';

import isOptionalAuthenticatedUserMiddleware from './is-optional-authenticated-user.middleware';
import requestContextMiddleware from './request-context.middleware';

const middlewares = {
  isOptionalAuthenticatedUser: isOptionalAuthenticatedUserMiddleware(
    logger,
    reporter
  ),

  requestContext: requestContextMiddleware(appContext.request),

  errorHandler: errorHandlerMiddleware(logger, reporter),

  isAuthenticatedUser: isAuthenticatedUserMiddleware(
    appContext.request,
    repos.user,
    services.auth
  ),
};

export default middlewares;
