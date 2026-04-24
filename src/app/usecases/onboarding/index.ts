import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../context';
import makeOnboardAccountingEntityUseCase from './onboard-accounting-entity.usecase';

const onboardingUseCases = {
  onboardAccountingEntity: makeOnboardAccountingEntityUseCase(
    appContext.request,
    repos.accountingEntity,
    repos.userPreferences,
    repos.ledgerAccount,
    services.repo,
    messaging.eventBus
  ),
};

export default onboardingUseCases;
