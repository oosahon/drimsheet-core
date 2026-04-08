import messaging from '../../../infra/messaging';
import eventBus from '../../../infra/messaging/event-bus';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../context';
import sendEmailVerificationEmailUseCase from './send-email-verification-email.usecase';
import signupWithEmailUsecase from './signup-with-email.usecase';
import verifyEmailAddressUseCase from './verify-email.usecase';

const authUseCase = {
  signupWithEmail: signupWithEmailUsecase(
    appContext.request,
    repos.user,
    services.auth,
    messaging.eventBus
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
    eventBus
  ),
};

export default authUseCase;
