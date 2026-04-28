import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import domainServices from '../../../infra/services/domain.service';
import appContext from '../../context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';
import makeEnqueueBalanceAdjustment from './enqueue-balance-adjustments.usecase';
import makeRecordOpeningBalanceUseCase from './record-opening-balance.usecase';

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

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    repos.ledgerAccount,
    repos.ledgerAccountBalance,
    messaging.queues
  ),
};

export default bookkeepingUseCases;
