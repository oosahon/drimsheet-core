import appContext from '../../../app/context';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import errorHandlerMiddleware from './error-handler.middleware';
import isAuthenticatedUserMiddleware from './is-authenticated-user.middleware';

import isOptionalAuthenticatedUserMiddleware from './is-optional-authenticated-user.middleware';
import requestContextInitMiddleware from './request-context-init.middleware';
import requestLoggerMiddleware from './request-logger.middleware';

import authUseCase from '../../../app/usecases/auth';
import {
  completeLoginWithGoogleMiddleware,
  initiateLoginWithGoogleMiddleware,
} from './google-oauth.middleware';

const middlewares = {
  initiateLoginWithGoogle: initiateLoginWithGoogleMiddleware(),

  completeLoginWithGoogle: completeLoginWithGoogleMiddleware(
    authUseCase.oAuth.handleGoogleCallback
  ),

  isOptionalAuthenticatedUser: isOptionalAuthenticatedUserMiddleware(
    observability.logger,
    observability.reporter
  ),

  requestContext: requestContextInitMiddleware(
    appContext.request,
    repos.accountingEntity
  ),

  errorHandler: errorHandlerMiddleware(
    observability.logger,
    observability.reporter
  ),

  isAuthenticatedUser: isAuthenticatedUserMiddleware(
    appContext.request,
    repos.user,
    services.auth
  ),

  requestLogger: requestLoggerMiddleware(
    observability.logger,
    observability.reporter,
    appContext.request
  ),
};

export default middlewares;
