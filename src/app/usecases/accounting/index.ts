import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';
import makeEnqueueBalanceAdjustment from './enqueue-balance-adjustments.usecase';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';

const accountingUsecases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    repos.ledgerAccountBalance,
    repos.ledgerAccount,
    observability.logger
  ),

  enqueueBalanceAdjustment: makeEnqueueBalanceAdjustment(
    appContext.request,
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.queues
  ),

  recordOpeningBalance: makeRecordOpeningBalanceUseCase(
    appContext.request,
    repos.exchangeRate,
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    repos.journalEntry,
    messaging.eventBus
  ),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.queues
  ),
};

export default accountingUsecases;
