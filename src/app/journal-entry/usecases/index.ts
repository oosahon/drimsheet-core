import messaging from '../../../infra/messaging';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import bookkeepingServices from '../../../infra/services/bookkeeping.service';
import currencyDomainServices from '../../../infra/services/domain/currency.domain.service';
import appContext from '../../shared/context';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';
import makeRecordTransferJournalEntryUseCase from './record-transfer-journal-entry.usecase';

const journalEntryUseCases = {
  recordOpeningBalance: makeRecordOpeningBalanceUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    messaging.eventBus,
    bookkeepingServices.openingBalanceEntry,
    bookkeepingServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate
  ),

  recordTransfer: makeRecordTransferJournalEntryUseCase(
    appContext.request,
    bookkeepingServices.transactionEntry,
    bookkeepingServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate,
    messaging.eventBus
  ),
};

export default journalEntryUseCases;
