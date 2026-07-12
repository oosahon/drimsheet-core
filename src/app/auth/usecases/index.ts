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
  signupWithEmail: makeSignupWithEmailUsecase({
    requestContext: appContext.request,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    repoService: services.repo,
  }),

  sendEmailVerificationEmail: makeSendEmailVerificationEmailUseCase({
    requestContext: appContext.request,
    logger: observability.logger,
    makeAuthService: services.auth,
    userRepo: userRepos.user,
    transactionalEmailService: services.transactionalEmail,
    varsConfig: services.varsConfig,
  }),

  verifyEmail: makeVerifyEmailAddressUseCase({
    makeAuthService: services.auth,
    userRepo: userRepos.user,
    requestContext: appContext.request,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  loginWithEmail: makeLoginWithEmailUseCase({
    reqContext: appContext.request,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  getPasswordResetLink: makeRequestPasswordResetUseCase({
    requestContext: appContext.request,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    transactionEmailService: services.transactionalEmail,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    varsConfig: services.varsConfig,
  }),

  resetPassword: makeResetPasswordUseCase({
    requestContext: appContext.request,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  oAuth: makeOauthUsecase({
    reqContext: appContext.request,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
    webAppUrl: services.varsConfig.WEB_APP_URL,
  }),

  makeGoogleOAuthHelper: makeGoogleOAuthHelper(
    messaging.eventBus,
    appContext.request,
    userRepos.user,
    userRepos.userAuth,
    services.repo
  ),

  refreshAccessToken: makeRefreshAccessTokenUseCase({
    reqContext: appContext.request,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  logout: makeLogoutUseCase({
    reqContext: appContext.request,
    makeAuthService: services.auth,
    userSessionRepo: userRepos.userSession,
    logger: observability.logger,
  }),
};

export default authUseCase;
