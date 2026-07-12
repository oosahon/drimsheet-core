import makeCreateOpeningBalanceUseCase from '../../../app/journal-entry/usecases/create-opening-balance.usecase';
import makeCreatePaymentJournalEntryUseCase from '../../../app/journal-entry/usecases/create-payment-journal-entry.usecase';
import makeCreateTransferJournalEntryUseCase from '../../../app/journal-entry/usecases/create-transfer-journal-entry.usecase';
import appContext from '../../../app/shared/context';
import messaging from '../../messaging';
import ledgerRepos from '../../persistence/repos/ledger';
import bookkeepingServices from '../../services/bookkeeping.service';

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
