import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeGetAllAccountingEntitiesUseCase from './get-accounting-entities.usecase';
import makeSetupNonPowerUserPostingAccountsUseCase from './setup-non-power-user-posting-accounts.usecase';

const accountingEntityUsecase = {
  getAll: makeGetAllAccountingEntitiesUseCase(
    appContext.request,
    repos.accountingEntity
  ),

  setupNonPowerUserPostingAccounts: makeSetupNonPowerUserPostingAccountsUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.accountingEntity,
    messaging.eventBus
  ),
};

export default accountingEntityUsecase;
