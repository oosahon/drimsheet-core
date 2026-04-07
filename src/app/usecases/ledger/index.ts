import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import setupIndividualEntityBaseAccountsUseCase from './setup-individual-entity-base-accounts.usecase';

const ledgerAccountUsecases = {
  setupIndividualEntityBaseAccounts: setupIndividualEntityBaseAccountsUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.accountingEntity,
    messaging.eventBus
  ),
};

export default ledgerAccountUsecases;
