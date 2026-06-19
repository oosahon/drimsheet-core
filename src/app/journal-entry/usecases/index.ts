import messaging from '../../../infra/messaging';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import bookkeepingServices from '../../../infra/services/bookkeeping.service';
import currencyDomainServices from '../../../infra/services/domain/currency.domain.service';
import appContext from '../../shared/context';
import makeCreateJournalEntryUseCase from './create-journal-entry.usecase';
import makeCreateOpeningBalanceUseCase from './create-opening-balance.usecase';

const journalEntryUseCases = {
  createOpeningBalance: makeCreateOpeningBalanceUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    messaging.eventBus,
    bookkeepingServices.openingBalanceEntry,
    bookkeepingServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate
  ),

  create: makeCreateJournalEntryUseCase(
    appContext.request,
    bookkeepingServices.transactionEntry,
    bookkeepingServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate,
    messaging.eventBus
  ),
};

export default journalEntryUseCases;
