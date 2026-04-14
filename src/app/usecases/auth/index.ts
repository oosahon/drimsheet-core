import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../context';
import getPasswordResetLinkUseCase from './get-password-reset-link.usecase';
import loginWithEmailUseCase from './login-with-email.usecase';
import resetPasswordUseCase from './reset-password.usecase';
import sendEmailVerificationEmailUseCase from './send-email-verification-email.usecase';
import signupWithEmailUsecase from './signup-with-email.usecase';
import verifyEmailAddressUseCase from './verify-email.usecase';

const authUseCase = {
  signupWithEmail: signupWithEmailUsecase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    services.repo
  ),

  sendEmailVerificationEmail: sendEmailVerificationEmailUseCase(
    appContext.request,
    observability.logger,
    services.auth,
    repos.user,
    services.transactionalEmail
  ),

  verifyEmail: verifyEmailAddressUseCase(
    services.auth,
    repos.user,
    appContext.request,
    messaging.eventBus
  ),

  loginWithEmail: loginWithEmailUseCase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    repos.userSession,
    services.repo
  ),

  getPasswordResetLink: getPasswordResetLinkUseCase(
    appContext.request,
    repos.user,
    services.auth,
    services.transactionalEmail,
    messaging.eventBus,
    repos.userAuth
  ),

  resetPassword: resetPasswordUseCase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus,
    repos.userAuth,
    repos.userSession,
    services.repo
  ),
};

export default authUseCase;
