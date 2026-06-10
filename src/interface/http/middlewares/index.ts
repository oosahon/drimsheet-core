import authUseCase from '../../../app/auth/usecases';
import appContext from '../../../app/shared/context';
import observability from '../../../infra/observability';
import accountingRepos from '../../../infra/persistence/repos/accounting';
import userRepos from '../../../infra/persistence/repos/user';
import services from '../../../infra/services';
import accountingDomainServices from '../../../infra/services/domain/accounting.domain.service';
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
    accountingRepos.accountingEntity,
    services.auth,
    userRepos.user,
    observability.logger
  ),

  errorHandler: makeErrorHandlerMiddleware(),

  isAuthenticatedUser: makeIsAuthenticatedUserMiddleware(
    appContext.request,
    accountingDomainServices.accountingEntity
  ),

  requestLogger: makeRequestLoggerMiddleware(
    observability.logger,
    observability.reporter,
    appContext.request
  ),

  accountingEntityAccess: makeAccountingEntityAccessMiddleware(
    accountingDomainServices.accountingEntity,
    appContext.request
  ),
};

export default middlewares;
