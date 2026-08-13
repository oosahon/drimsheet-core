import makeEmailVerificationService from '@app/auth/services/email-verification.service';
import makeLoginWithEmailUseCase from '@app/auth/usecases/login-with-email.usecase';
import makeLoginWithGoogleUseCase from '@app/auth/usecases/login-with-google.usecase';
import makeLogoutUseCase from '@app/auth/usecases/logout.usecase';
import makeOauthUsecase from '@app/auth/usecases/oauth.usecase';
import makeRefreshAccessTokenUseCase from '@app/auth/usecases/refresh-access-token.usecase';
import makeRequestPasswordResetUseCase from '@app/auth/usecases/request-password-reset.usecase';
import makeResetPasswordUseCase from '@app/auth/usecases/reset-password.usecase';
import makeSendEmailVerificationEmailUseCase from '@app/auth/usecases/send-email-verification-email.usecase';
import makeSignupWithEmailUsecase from '@app/auth/usecases/signup-with-email.usecase';
import makeVerifyEmailAddressUseCase from '@app/auth/usecases/verify-email.usecase';

import vars from '@infra/config/vars.config';
import { passwordService, tokenService } from '@infra/ioc/services/auth';
import { transactionalEmailService } from '@infra/ioc/services/notification';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import observability from '@infra/observability';
import cacheStorage from '@infra/persistence/cache/cache-storage.impl';
import userRepos from '@infra/persistence/repos/user';
import appContext from '@infra/runtime/app-context';

const emailVerificationService = makeEmailVerificationService({
  cacheStorage,
  tokenService,
  transactionalEmailService,
  varsConfig: vars,
});

export const sendEmailVerificationEmailUseCase =
  makeSendEmailVerificationEmailUseCase({
    appContext: appContext,
    logger: observability.logger,
    userRepo: userRepos.user,
    emailVerificationService,
  });

export const signupWithEmailUseCase = makeSignupWithEmailUsecase({
  appContext: appContext,
  userRepo: userRepos.user,
  passwordService,
  eventBus: messaging.eventBus,
  userAuthRepo: userRepos.userAuth,
  repoService,
  emailVerificationService,
});

export const verifyEmailUseCase = makeVerifyEmailAddressUseCase({
  tokenService,
  userRepo: userRepos.user,
  appContext: appContext,
  eventBus: messaging.eventBus,
  userSessionRepo: userRepos.userSession,
  repoService,
});

export const loginWithEmailUseCase = makeLoginWithEmailUseCase({
  reqContext: appContext,
  userRepo: userRepos.user,
  passwordService,
  tokenService,
  eventBus: messaging.eventBus,
  userAuthRepo: userRepos.userAuth,
  userSessionRepo: userRepos.userSession,
  repoService,
});

export const getPasswordResetLinkUseCase = makeRequestPasswordResetUseCase({
  appContext: appContext,
  userRepo: userRepos.user,
  tokenService,
  transactionEmailService: transactionalEmailService,
  eventBus: messaging.eventBus,
  userAuthRepo: userRepos.userAuth,
  varsConfig: vars,
});

export const resetPasswordUseCase = makeResetPasswordUseCase({
  appContext: appContext,
  userRepo: userRepos.user,
  passwordService,
  tokenService,
  eventBus: messaging.eventBus,
  userAuthRepo: userRepos.userAuth,
  userSessionRepo: userRepos.userSession,
  repoService,
  reporter: observability.reporter,
});

export const oAuthUseCase = makeOauthUsecase({
  reqContext: appContext,
  tokenService,
  eventBus: messaging.eventBus,
  userSessionRepo: userRepos.userSession,
  repoService,
  webAppUrl: vars.WEB_APP_URL,
});

export const loginWithGoogleUseCase = makeLoginWithGoogleUseCase(
  messaging.eventBus,
  appContext,
  userRepos.user,
  userRepos.userAuth,
  repoService
);

export const refreshAccessTokenUseCase = makeRefreshAccessTokenUseCase({
  reqContext: appContext,
  userRepo: userRepos.user,
  tokenService,
  eventBus: messaging.eventBus,
  userSessionRepo: userRepos.userSession,
  repoService,
});

export const logoutUseCase = makeLogoutUseCase({
  reqContext: appContext,
  tokenService,
  userSessionRepo: userRepos.userSession,
});
