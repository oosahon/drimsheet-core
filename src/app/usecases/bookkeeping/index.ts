import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import domainServices from '../../../infra/services/domain.service';
import appContext from '../../context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';
import makeEnqueueBalanceAdjustment from './enqueue-balance-adjustments.usecase';
import makeGetAccountTransactionsUseCase from './get-account-transactions.usecase';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';
import makeRecordTransferJournalEntryUseCase from './record-transfer-journal-entry.usecase';

const bookkeepingUseCases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    repos.ledgerAccountBalance,
    repos.ledgerAccount,
    observability.logger,
    domainServices.accountBalance
  ),

  enqueueBalanceAdjustment: makeEnqueueBalanceAdjustment(
    appContext.request,
    messaging.queues,
    domainServices.bookkeeping
  ),

  recordOpeningBalance: makeRecordOpeningBalanceUseCase(
    appContext.request,
    repos.ledgerAccount,
    repos.journalEntry,
    messaging.eventBus,
    domainServices.bookkeeping,
    domainServices.exchangeRate
  ),

  recordTransfer: makeRecordTransferJournalEntryUseCase(
    appContext.request,
    domainServices.bookkeeping,
    domainServices.exchangeRate,
    repos.journalEntry,
    messaging.eventBus
  ),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.queues
  ),

  getAccountTransactions: makeGetAccountTransactionsUseCase(
    appContext.request,
    repos.ledgerAccount,
    domainServices.ledgerAccount,
    repos.accountTransactionQuery
  ),
};

export default bookkeepingUseCases;
