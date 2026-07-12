import messaging from '../../../infra/messaging';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import bookkeepingServices from '../../../infra/services/bookkeeping.service';
import appContext from '../../shared/context';
import makeCreateOpeningBalanceUseCase from './create-opening-balance.usecase';
import makeCreatePaymentJournalEntryUseCase from './create-payment-journal-entry.usecase';
import makeCreateTransferJournalEntryUseCase from './create-transfer-journal-entry.usecase';

const journalEntryUseCases = {
  createOpeningBalance: makeCreateOpeningBalanceUseCase({
    requestContext: appContext.request,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    eventBus: messaging.eventBus,
    openingBalanceEntryService: bookkeepingServices.openingBalanceEntry,
    journalEntryPersistenceService: bookkeepingServices.journalEntryPersistence,
  }),

  createPayment: makeCreatePaymentJournalEntryUseCase({
    requestContext: appContext.request,
    transactionEntryService: bookkeepingServices.transactionEntry,
    journalEntryPersistenceService: bookkeepingServices.journalEntryPersistence,
    eventBus: messaging.eventBus,
  }),

  createTransfer: makeCreateTransferJournalEntryUseCase({
    requestContext: appContext.request,
    transactionEntryService: bookkeepingServices.transactionEntry,
    journalEntryPersistenceService: bookkeepingServices.journalEntryPersistence,
    eventBus: messaging.eventBus,
  }),
};

export default journalEntryUseCases;
