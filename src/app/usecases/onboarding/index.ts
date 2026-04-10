import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../context';
import onboardAccountingEntityUseCase from './onboard-accounting-entity.usecase';

const onboardingUseCases = {
  onboardAccountingEntity: onboardAccountingEntityUseCase(
    appContext.request,
    repos.accountingEntity,
    repos.userPreferences,
    services.repo,
    messaging.eventBus
  ),
};

export default onboardingUseCases;
