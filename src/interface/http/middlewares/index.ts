import appContext from '../../../app/context';
import authUseCase from '../../../app/usecases/auth';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import domainServices from '../../../infra/services/domain.service';
import makeAccountingEntityAccessMiddleware from './accounting-entity-access.middleware';
import makeErrorHandlerMiddleware from './error-handler.middleware';
import {
  makeCompleteLoginWithGoogleMiddleware,
  makeInitiateLoginWithGoogleMiddleware,
} from './google-oauth.middleware';
import makeIsAuthenticatedUserMiddleware from './is-authenticated-user.middleware';
import makeIsOptionalAuthenticatedUserMiddleware from './is-optional-authenticated-user.middleware';
import makeRequestContextInitMiddleware from './request-context-init.middleware';
import makeRequestLoggerMiddleware from './request-logger.middleware';

const middlewares = {
  initiateLoginWithGoogle: makeInitiateLoginWithGoogleMiddleware(),

  completeLoginWithGoogle: makeCompleteLoginWithGoogleMiddleware(
    authUseCase.oAuth.handleGoogleCallback
  ),

  isOptionalAuthenticatedUser: makeIsOptionalAuthenticatedUserMiddleware(
    observability.logger,
    observability.reporter
  ),

  requestContext: makeRequestContextInitMiddleware(
    appContext.request,
    repos.accountingEntity,
    services.auth,
    repos.user,
    observability.logger
  ),

  errorHandler: makeErrorHandlerMiddleware(),

  isAuthenticatedUser: makeIsAuthenticatedUserMiddleware(
    appContext.request,
    domainServices.accountingEntity
  ),

  requestLogger: makeRequestLoggerMiddleware(
    observability.logger,
    observability.reporter,
    appContext.request
  ),

  accountingEntityAccess: makeAccountingEntityAccessMiddleware(
    domainServices.accountingEntity,
    appContext.request
  ),
};

export default middlewares;
