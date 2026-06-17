import messaging from '../../../infra/messaging';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import currencyDomainServices from '../../../infra/services/domain/currency.domain.service';
import journalEntryDomainServices from '../../../infra/services/domain/journal-entry.domain.service';
import appContext from '../../shared/context';
import makeEnqueueBalanceAdjustment from './enqueue-balance-adjustments.usecase';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';
import makeRecordTransferJournalEntryUseCase from './record-transfer-journal-entry.usecase';

const journalEntryUseCases = {
  enqueueBalanceAdjustment: makeEnqueueBalanceAdjustment(
    appContext.request,
    messaging.queues.ledgerBalanceAdjustment,
    journalEntryDomainServices.journalEntry
  ),

  recordOpeningBalance: makeRecordOpeningBalanceUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    messaging.eventBus,
    journalEntryDomainServices.journalEntry,
    journalEntryDomainServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate
  ),

  recordTransfer: makeRecordTransferJournalEntryUseCase(
    appContext.request,
    journalEntryDomainServices.journalEntry,
    journalEntryDomainServices.journalEntryPersistence,
    currencyDomainServices.exchangeRate,
    messaging.eventBus
  ),
};

export default journalEntryUseCases;
