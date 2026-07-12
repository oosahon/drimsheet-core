import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import services from '../../../infra/services';
import bookkeepingServices from '../../../infra/services/bookkeeping.service';
import currencyServices from '../../../infra/services/currency.service';
import ledgerDomainServices from '../../../infra/services/domain/ledger.domain.service';
import fxCostBasisService from '../../../infra/services/fx-lot-cost-basis.service';
import appContext from '../../shared/context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';

import makeCreatePettyCashAccountUseCase from './create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from './get-account-transactions.usecase';
import makeGetLedgerAccountUseCase from './get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from './get-ledger-accounts.usecase';

const ledgerUseCases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase(
    appContext.request,
    observability.reporter,
    ledgerRepos.ledgerAccount,
    ledgerRepos.ledgerAccountBalance
  ),

  getLedgerAccount: makeGetLedgerAccountUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    observability.reporter,
    ledgerRepos.ledgerAccountBalance
  ),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    ledgerRepos.ledgerAccount,
    ledgerRepos.ledgerAccountBalance,
    messaging.queues.ledgerBalanceAdjustment
  ),

  getAccountTransactions: makeGetAccountTransactionsUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    ledgerDomainServices.ledgerAccount,
    ledgerRepos.queries.accountTransaction
  ),

  createPettyCashAccount: makeCreatePettyCashAccountUseCase(
    appContext.request,
    messaging.eventBus,
    ledgerDomainServices.assetAccount,
    bookkeepingServices.openingBalanceEntry,
    bookkeepingServices.journalEntryPersistence,
    services.repo,
    ledgerDomainServices.persistence,
    fxCostBasisService.persistence,
    fxCostBasisService.domain,
    currencyServices.exchangeRate
  ),
};

export default ledgerUseCases;
