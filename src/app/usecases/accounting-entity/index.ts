import appContext from '../../context';
import repos from '../../../infra/persistence/repos';
import getAllAccountingEntitiesUseCase from './get-accounting-entities.usecase';
import setupNonPowerUserPostingAccountsUseCase from './setup-non-power-user-posting-accounts.usecase';
import messaging from '../../../infra/messaging';

const accountingEntityUsecase = {
  getAll: getAllAccountingEntitiesUseCase(
    appContext.request,
    repos.accountingEntity
  ),

  setupNonPowerUserPostingAccounts: setupNonPowerUserPostingAccountsUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.accountingEntity,
    messaging.eventBus
  ),
};

export default accountingEntityUsecase;
