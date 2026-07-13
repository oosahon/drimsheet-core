import authUseCase from '../../../infra/ioc/usecases/auth.usecases';
import observability from '../../../infra/observability';
import accountingRepos from '../../../infra/persistence/repos/accounting';
import userRepos from '../../../infra/persistence/repos/user';
import appContext from '../../../infra/runtime/app-context';
import services from '../../../infra/services';
import accountingDomainServices from '../../../infra/services/domain/accounting.domain.service';
import makeAccountingEntityAccessMiddleware from './accounting-entity-access.middleware';
import makeAppContextInitMiddleware from './app-context-init.middleware';
import makeErrorHandlerMiddleware from './error-handler.middleware';
import {
  makeCompleteLoginWithGoogleMiddleware,
  makeInitiateLoginWithGoogleMiddleware,
} from './google-oauth.middleware';
import makeIsAuthenticatedUserMiddleware from './is-authenticated-user.middleware';
import makeIsOptionalAuthenticatedUserMiddleware from './is-optional-authenticated-user.middleware';
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

  appContext: makeAppContextInitMiddleware(
    appContext,
    accountingRepos.accountingEntity,
    services.auth,
    userRepos.user,
    observability.logger
  ),

  errorHandler: makeErrorHandlerMiddleware(),

  isAuthenticatedUser: makeIsAuthenticatedUserMiddleware(
    appContext,
    accountingDomainServices.accountingEntity
  ),

  requestLogger: makeRequestLoggerMiddleware(
    observability.logger,
    observability.reporter,
    appContext
  ),

  accountingEntityAccess: makeAccountingEntityAccessMiddleware(
    accountingDomainServices.accountingEntity,
    appContext
  ),
};

export default middlewares;
