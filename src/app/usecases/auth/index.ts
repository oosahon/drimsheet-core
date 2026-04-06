import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import repoService from '../../../infra/services/repo.service';
import appContext from '../../context';
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
};

export default authUseCase;
