import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import userRepos from '../../../infra/persistence/repos/user';
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
    userRepos.user,
    services.auth,
    messaging.eventBus,
    userRepos.userAuth,
    services.repo
  ),

  sendEmailVerificationEmail: makeSendEmailVerificationEmailUseCase(
    appContext.request,
    observability.logger,
    services.auth,
    userRepos.user,
    services.transactionalEmail,
    services.varsConfig
  ),

  verifyEmail: makeVerifyEmailAddressUseCase(
    services.auth,
    userRepos.user,
    appContext.request,
    messaging.eventBus,
    userRepos.userSession,
    services.repo
  ),

  loginWithEmail: makeLoginWithEmailUseCase(
    appContext.request,
    userRepos.user,
    services.auth,
    messaging.eventBus,
    userRepos.userAuth,
    userRepos.userSession,
    services.repo
  ),

  getPasswordResetLink: makeRequestPasswordResetUseCase(
    appContext.request,
    userRepos.user,
    services.auth,
    services.transactionalEmail,
    messaging.eventBus,
    userRepos.userAuth,
    services.varsConfig
  ),

  resetPassword: makeResetPasswordUseCase(
    appContext.request,
    userRepos.user,
    services.auth,
    messaging.eventBus,
    userRepos.userAuth,
    userRepos.userSession,
    services.repo
  ),

  oAuth: makeOauthUsecase(
    appContext.request,
    services.auth,
    messaging.eventBus,
    userRepos.userSession,
    services.repo,
    services.varsConfig.WEB_APP_URL
  ),

  makeGoogleOAuthHelper: makeGoogleOAuthHelper(
    messaging.eventBus,
    appContext.request,
    userRepos.user,
    userRepos.userAuth,
    services.repo
  ),

  refreshAccessToken: makeRefreshAccessTokenUseCase(
    appContext.request,
    userRepos.user,
    services.auth,
    messaging.eventBus,
    userRepos.userSession,
    services.repo
  ),

  logout: makeLogoutUseCase(
    appContext.request,
    services.auth,
    userRepos.userSession,
    observability.logger
  ),
};

export default authUseCase;
