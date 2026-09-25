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
import {
  passwordService,
  tokenService,
  userAuthService,
  userSessionPersistenceService,
  userSessionService,
} from '@infra/ioc/services/auth';
import { transactionalEmailService } from '@infra/ioc/services/notification';
import { repoService } from '@infra/ioc/services/repo';
import { actorService, userIdentityService } from '@infra/ioc/services/user';
import messaging from '@infra/messaging';
import observability from '@infra/observability';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import cacheStorage from '@infra/persistence/cache/cache-storage.impl';
import userRepos from '@infra/persistence/repos/user';
import appContext from '@infra/runtime/app-context';

const emailVerificationService = makeEmailVerificationService({
  cacheStorage,
  tokenService,
  transactionalEmailService,
  varsConfig: vars,
});

export const sendEmailVerificationEmailUseCase = makeTracedUseCase(
  'auth.sendEmailVerificationEmailUseCase',
  makeSendEmailVerificationEmailUseCase({
    appContext: appContext,
    logger: observability.logger,
    userRepo: userRepos.user,
    emailVerificationService,
  })
);

export const signupWithEmailUseCase = makeTracedUseCase(
  'auth.signupWithEmailUseCase',
  makeSignupWithEmailUsecase({
    actorRepo: userRepos.actor,
    actorService,
    userIdentityService,
    appContext: appContext,
    userRepo: userRepos.user,
    passwordService,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userAuthService,
    repoService,
    emailVerificationService,
  })
);

export const verifyEmailUseCase = makeTracedUseCase(
  'auth.verifyEmailUseCase',
  makeVerifyEmailAddressUseCase({
    actorService,
    tokenService,
    userRepo: userRepos.user,
    appContext: appContext,
    eventBus: messaging.eventBus,
    userSessionService,
    userSessionPersistenceService,
    repoService,
  })
);

export const loginWithEmailUseCase = makeTracedUseCase(
  'auth.loginWithEmailUseCase',
  makeLoginWithEmailUseCase({
    actorService,
    reqContext: appContext,
    userRepo: userRepos.user,
    passwordService,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userAuthService,
    userSessionService,
    userSessionPersistenceService,
  })
);

export const getPasswordResetLinkUseCase = makeTracedUseCase(
  'auth.getPasswordResetLinkUseCase',
  makeRequestPasswordResetUseCase({
    appContext: appContext,
    userRepo: userRepos.user,
    tokenService,
    transactionEmailService: transactionalEmailService,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    varsConfig: vars,
  })
);

export const resetPasswordUseCase = makeTracedUseCase(
  'auth.resetPasswordUseCase',
  makeResetPasswordUseCase({
    actorService,
    appContext: appContext,
    userRepo: userRepos.user,
    passwordService,
    tokenService,
    eventBus: messaging.eventBus,
    userAuthRepo: userRepos.userAuth,
    userAuthService,
    userSessionService,
    userSessionPersistenceService,
    repoService,
    reporter: observability.reporter,
  })
);

const oAuthUseCaseComposition = makeOauthUsecase({
  actorService,
  reqContext: appContext,
  userSessionService,
  userSessionPersistenceService,
  webAppUrl: vars.WEB_APP_URL,
});

export const oAuthUseCase = {
  ...oAuthUseCaseComposition,
  handleGoogleCallback: makeTracedUseCase(
    'auth.oAuthUseCase',
    oAuthUseCaseComposition.handleGoogleCallback
  ),
};

export const loginWithGoogleUseCase = makeTracedUseCase(
  'auth.loginWithGoogleUseCase',
  makeLoginWithGoogleUseCase({
    actorRepo: userRepos.actor,
    actorService,
    userIdentityService,
    eventBus: messaging.eventBus,
    appContext,
    userRepo: userRepos.user,
    userAuthRepo: userRepos.userAuth,
    userAuthService,
    repoService,
  })
);

export const refreshAccessTokenUseCase = makeTracedUseCase(
  'auth.refreshAccessTokenUseCase',
  makeRefreshAccessTokenUseCase({
    actorService,
    reqContext: appContext,
    userRepo: userRepos.user,
    tokenService,
    userSessionService,
    userSessionPersistenceService,
  })
);

export const logoutUseCase = makeTracedUseCase(
  'auth.logoutUseCase',
  makeLogoutUseCase({
    reqContext: appContext,
    tokenService,
    userSessionRepo: userRepos.userSession,
  })
);
