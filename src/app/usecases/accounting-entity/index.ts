import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import getAllAccountingEntitiesUseCase from './get-accounting-entities.usecase';
import setupNonPowerUserPostingAccountsUseCase from './setup-non-power-user-posting-accounts.usecase';

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
