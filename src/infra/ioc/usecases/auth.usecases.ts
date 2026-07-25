import makeEmailVerificationService from '../../../app/auth/services/email-verification.service';
import makeGoogleOAuthHelper from '../../../app/auth/usecases/helpers/google-oauth.helper';
import makeLoginWithEmailUseCase from '../../../app/auth/usecases/login-with-email.usecase';
import makeLogoutUseCase from '../../../app/auth/usecases/logout.usecase';
import makeOauthUsecase from '../../../app/auth/usecases/oauth.usecase';
import makeRefreshAccessTokenUseCase from '../../../app/auth/usecases/refresh-access-token.usecase';
import makeRequestPasswordResetUseCase from '../../../app/auth/usecases/request-password-reset.usecase';
import makeResetPasswordUseCase from '../../../app/auth/usecases/reset-password.usecase';
import makeSendEmailVerificationEmailUseCase from '../../../app/auth/usecases/send-email-verification-email.usecase';
import makeSignupWithEmailUsecase from '../../../app/auth/usecases/signup-with-email.usecase';
import makeVerifyEmailAddressUseCase from '../../../app/auth/usecases/verify-email.usecase';
import * as varsConfig from '../../config/vars.config';
import messaging from '../../messaging';
import observability from '../../observability';
import cacheStorage from '../../persistence/cache/cache-storage.impl';
import userRepos from '../../persistence/repos/user';
import appContext from '../../runtime/app-context';
import authService from '../services/auth.service';
import notificationService from '../services/notification.service';
import repoService from '../services/repo.service';

const emailVerificationService = makeEmailVerificationService({
  cacheStorage,
  tokenService: authService.token,
  transactionalEmailService: notificationService.transactionalEmail,
  varsConfig,
});

const sendEmailVerificationEmail = makeSendEmailVerificationEmailUseCase({
  appContext: appContext,
  logger: observability.logger,
  userRepo: userRepos.user,
  emailVerificationService,
});

const authUseCase = {
  signupWithEmail: makeSignupWithEmailUsecase({
    appContext: appContext,
    userRepo: userRepos.user,
    passwordService: authService.password,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    repoService,
    emailVerificationService,
  }),

  sendEmailVerificationEmail,

  verifyEmail: makeVerifyEmailAddressUseCase({
    tokenService: authService.token,
    userRepo: userRepos.user,
    appContext: appContext,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService,
  }),

  loginWithEmail: makeLoginWithEmailUseCase({
    reqContext: appContext,
    userRepo: userRepos.user,
    passwordService: authService.password,
    tokenService: authService.token,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService,
  }),

  getPasswordResetLink: makeRequestPasswordResetUseCase({
    appContext: appContext,
    userRepo: userRepos.user,
    tokenService: authService.token,
    transactionEmailService: notificationService.transactionalEmail,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    varsConfig: varsConfig,
  }),

  resetPassword: makeResetPasswordUseCase({
    appContext: appContext,
    userRepo: userRepos.user,
    passwordService: authService.password,
    tokenService: authService.token,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userSessionRepo: userRepos.userSession,
    repoService,
    reporter: observability.reporter,
  }),

  oAuth: makeOauthUsecase({
    reqContext: appContext,
    tokenService: authService.token,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService,
    webAppUrl: varsConfig.WEB_APP_URL,
  }),

  makeGoogleOAuthHelper: makeGoogleOAuthHelper(
    messaging.eventBus,
    appContext,
    userRepos.user,
    userRepos.userAuth,
    repoService
  ),

  refreshAccessToken: makeRefreshAccessTokenUseCase({
    reqContext: appContext,
    userRepo: userRepos.user,
    tokenService: authService.token,
    eventBus: messaging.eventBus,
    userSessionRepo: userRepos.userSession,
    repoService,
  }),

  logout: makeLogoutUseCase({
    reqContext: appContext,
    tokenService: authService.token,
    userSessionRepo: userRepos.userSession,
  }),
};

export default authUseCase;
