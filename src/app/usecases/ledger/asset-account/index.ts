import messaging from '../../../../infra/messaging';
import repos from '../../../../infra/persistence/repos';
import services from '../../../../infra/services';
import appContext from '../../../context';
import makeCreatePettyCashSubAccountUseCase from './create-petty-cash-sub-account.usecase';

const assetAccountUseCase = {
  createPettyCashSubAccount: makeCreatePettyCashSubAccountUseCase(
    appContext.request,
    messaging.eventBus,
    repos.ledgerAccount,
    services.repo,
    repos.journalEntry,
    repos.exchangeRate
  ),
};

export default assetAccountUseCase;
