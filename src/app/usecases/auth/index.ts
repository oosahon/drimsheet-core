import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import repoService from '../../../infra/services/repo.service';
import appContext from '../../context';
import sendEmailVerificationEmailUseCase from './send-email-verification-email.usecase';
import signupWithEmailUsecase from './signup-with-email.usecase';

const authUseCase = {
  signupWithEmail: signupWithEmailUsecase(
    repoService,
    appContext.request,
    repos.user,
    services.auth,
    repos.accountingEntity,
    messaging.eventBus
  ),

  sendEmailVerificationEmail: sendEmailVerificationEmailUseCase(
    appContext.request,
    observability.logger,
    services.auth,
    repos.user,
    services.transactionalEmail
  ),
};

export default authUseCase;
