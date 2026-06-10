import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import bookkeepingRepos from '../../../infra/persistence/repos/bookkeeping';
import journalEntryRepos from '../../../infra/persistence/repos/journal-entry';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import bookkeepingDomainServices from '../../../infra/services/domain/bookkeeping.domain.service';
import currencyDomainServices from '../../../infra/services/domain/currency.domain.service';
import ledgerDomainServices from '../../../infra/services/domain/ledger.domain.service';
import appContext from '../../shared/context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';
import makeEnqueueBalanceAdjustment from './enqueue-balance-adjustments.usecase';
import makeGetAccountTransactionsUseCase from './get-account-transactions.usecase';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';
import makeRecordTransferJournalEntryUseCase from './record-transfer-journal-entry.usecase';

const bookkeepingUseCases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    bookkeepingRepos.ledgerAccountBalance,
    ledgerRepos.ledgerAccount,
    observability.logger,
    bookkeepingDomainServices.accountBalance
  ),

  enqueueBalanceAdjustment: makeEnqueueBalanceAdjustment(
    appContext.request,
    messaging.queues,
    bookkeepingDomainServices.bookkeeping
  ),

  recordOpeningBalance: makeRecordOpeningBalanceUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    journalEntryRepos.journalEntry,
    messaging.eventBus,
    bookkeepingDomainServices.bookkeeping,
    currencyDomainServices.exchangeRate
  ),

  recordTransfer: makeRecordTransferJournalEntryUseCase(
    appContext.request,
    bookkeepingDomainServices.bookkeeping,
    currencyDomainServices.exchangeRate,
    journalEntryRepos.journalEntry,
    messaging.eventBus
  ),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    ledgerRepos.ledgerAccount,
    bookkeepingRepos.ledgerAccountBalance,
    messaging.queues
  ),

  getAccountTransactions: makeGetAccountTransactionsUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    ledgerDomainServices.ledgerAccount,
    bookkeepingRepos.queries.accountTransaction
  ),
};

export default bookkeepingUseCases;
