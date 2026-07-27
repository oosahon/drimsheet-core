import * as varsConfig from '../../../infra/config/vars.config';
import accountingDomainServices from '../../../infra/ioc/services/accounting';
import authService from '../../../infra/ioc/services/auth';
import authUseCase from '../../../infra/ioc/usecases/auth';
import observability from '../../../infra/observability';
import accountingRepos from '../../../infra/persistence/repos/accounting';
import userRepos from '../../../infra/persistence/repos/user';
import appContext from '../../../infra/runtime/app-context';
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

  completeLoginWithGoogle: makeCompleteLoginWithGoogleMiddleware((user) =>
    authUseCase.oAuth.handleGoogleCallback(user)
  ),

  isOptionalAuthenticatedUser: makeIsOptionalAuthenticatedUserMiddleware(
    observability.logger,
    observability.reporter
  ),

  appContext: makeAppContextInitMiddleware(
    appContext,
    accountingRepos.accountingEntity,
    authService.token,
    userRepos.user,
    observability.logger,
    varsConfig
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
