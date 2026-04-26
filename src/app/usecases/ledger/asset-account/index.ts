import messaging from '../../../../infra/messaging';
import repos from '../../../../infra/persistence/repos';
import appContext from '../../../context';
import makeCreatePettyCashSubAccountUseCase from './create-petty-cash-sub-account.usecase';

const assetAccountUseCase = {
  createPettyCashSubAccount: makeCreatePettyCashSubAccountUseCase(
    appContext.request,
    messaging.eventBus,
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    repos.journalEntry,
    repos.exchangeRate
  ),
};

export default assetAccountUseCase;
