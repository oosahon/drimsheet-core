import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../shared/context';
import makeGoogleOAuthHelper from './helpers/oauth-handler-google.helper';
import makeLoginWithEmailUseCase from './login-with-email.usecase';
import makeLogoutUseCase from './logout.usecase';
import makeOauthUsecase from './oauth.usecase';
import makeRefreshAccessTokenUseCase from './refresh-access-token.usecase';
import makeRequestPasswordResetUseCase from './request-password-reset.usecase';
import makeResetPasswordUseCase from './reset-password.usecase';
import makeSendEmailVerificationEmailUseCase from './send-email-verification-email.usecase';
import makeSignupWithEmailUsecase from './signup-with-email.usecase';
import makeVerifyEmailAddressUseCase from './verify-email.usecase';

const authUseCase = {
  signupWithEmail: makeSignupWithEmailUsecase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    services.repo
  ),

  sendEmailVerificationEmail: makeSendEmailVerificationEmailUseCase(
    appContext.request,
    observability.logger,
    services.auth,
    repos.user,
    services.transactionalEmail,
    services.varsConfig
  ),

  verifyEmail: makeVerifyEmailAddressUseCase(
    services.auth,
    repos.user,
    appContext.request,
    messaging.eventBus,
    repos.userSession,
    services.repo
  ),

  loginWithEmail: makeLoginWithEmailUseCase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    repos.userSession,
    services.repo
  ),

  getPasswordResetLink: makeRequestPasswordResetUseCase(
    appContext.request,
    repos.user,
    services.auth,
    services.transactionalEmail,
    messaging.eventBus,
    repos.userAuth,
    services.varsConfig
  ),

  resetPassword: makeResetPasswordUseCase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    repos.userSession,
    services.repo
  ),

  oAuth: makeOauthUsecase(
    appContext.request,
    services.auth,
    messaging.eventBus,
    repos.userSession,
    services.repo,
    services.varsConfig.WEB_APP_URL
  ),

  makeGoogleOAuthHelper: makeGoogleOAuthHelper(
    messaging.eventBus,
    appContext.request,
    repos.user,
    repos.userAuth,
    services.repo
  ),

  refreshAccessToken: makeRefreshAccessTokenUseCase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userSession,
    services.repo
  ),

  logout: makeLogoutUseCase(
    appContext.request,
    services.auth,
    repos.userSession,
    observability.logger
  ),
};

export default authUseCase;
