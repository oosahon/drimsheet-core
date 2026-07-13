import makeGoogleOAuthHelper from '../../../app/auth/usecases/helpers/oauth-handler-google.helper';
import makeLoginWithEmailUseCase from '../../../app/auth/usecases/login-with-email.usecase';
import makeLogoutUseCase from '../../../app/auth/usecases/logout.usecase';
import makeOauthUsecase from '../../../app/auth/usecases/oauth.usecase';
import makeRefreshAccessTokenUseCase from '../../../app/auth/usecases/refresh-access-token.usecase';
import makeRequestPasswordResetUseCase from '../../../app/auth/usecases/request-password-reset.usecase';
import makeResetPasswordUseCase from '../../../app/auth/usecases/reset-password.usecase';
import makeSendEmailVerificationEmailUseCase from '../../../app/auth/usecases/send-email-verification-email.usecase';
import makeSignupWithEmailUsecase from '../../../app/auth/usecases/signup-with-email.usecase';
import makeVerifyEmailAddressUseCase from '../../../app/auth/usecases/verify-email.usecase';
import messaging from '../../messaging';
import observability from '../../observability';
import userRepos from '../../persistence/repos/user';
import appContext from '../../runtime/app-context';
import services from '../../services';

const authUseCase = {
  signupWithEmail: makeSignupWithEmailUsecase({
    appContext: appContext,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    repoService: services.repo,
  }),

  sendEmailVerificationEmail: makeSendEmailVerificationEmailUseCase({
    appContext: appContext,
    logger: observability.logger,
    makeAuthService: services.auth,
    userRepo: userRepos.user,
    transactionalEmailService: services.transactionalEmail,
    varsConfig: services.varsConfig,
  }),

  verifyEmail: makeVerifyEmailAddressUseCase({
    makeAuthService: services.auth,
    userRepo: userRepos.user,
    appContext: appContext,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  loginWithEmail: makeLoginWithEmailUseCase({
    reqContext: appContext,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  getPasswordResetLink: makeRequestPasswordResetUseCase({
    appContext: appContext,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    transactionEmailService: services.transactionalEmail,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    varsConfig: services.varsConfig,
  }),

  resetPassword: makeResetPasswordUseCase({
    appContext: appContext,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  oAuth: makeOauthUsecase({
    reqContext: appContext,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
    webAppUrl: services.varsConfig.WEB_APP_URL,
  }),

  makeGoogleOAuthHelper: makeGoogleOAuthHelper(
    messaging.eventBus,
    appContext,
    userRepos.user,
    userRepos.userAuth,
    services.repo
  ),

  refreshAccessToken: makeRefreshAccessTokenUseCase({
    reqContext: appContext,
    userRepo: userRepos.user,
    makeAuthService: services.auth,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService: services.repo,
  }),

  logout: makeLogoutUseCase({
    reqContext: appContext,
    makeAuthService: services.auth,
    userSessionRepo: userRepos.userSession,
    logger: observability.logger,
  }),
};

export default authUseCase;
