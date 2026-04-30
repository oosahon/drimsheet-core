import messaging from '../../../../infra/messaging';
import repos from '../../../../infra/persistence/repos';
import domainServices from '../../../../infra/services/domain.service';
import appContext from '../../../context';
import makeCreatePettyCashSubAccountUseCase from './create-petty-cash-sub-account.usecase';

const assetAccountUseCase = {
  makePettyCashSubAccount: makeCreatePettyCashSubAccountUseCase(
    appContext.request,
    messaging.eventBus,
    repos.ledgerAccount,
    repos.journalEntry,
    domainServices.assetAccount,
    domainServices.bookkeeping,
    domainServices.exchangeRate
  ),
};

export default assetAccountUseCase;
