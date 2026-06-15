import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import journalEntryRepos from '../../../infra/persistence/repos/journal-entry';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import services from '../../../infra/services';
import currencyDomainServices from '../../../infra/services/domain/currency.domain.service';
import journalEntryDomainServices from '../../../infra/services/domain/journal-entry.domain.service';
import ledgerBalanceDomainServices from '../../../infra/services/domain/ledger-balance.domain.service';
import ledgerDomainServices from '../../../infra/services/domain/ledger.domain.service';
import appContext from '../../shared/context';
import makeAdjustLedgerAccountBalanceUseCase from './adjust-ledger-account-balance.usecase';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';
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

  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    ledgerRepos.ledgerAccountBalance,
    ledgerRepos.ledgerAccount,
    observability.logger,
    ledgerBalanceDomainServices.accountBalance
  ),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase(
    ledgerRepos.ledgerAccount,
    ledgerRepos.ledgerAccountBalance,
    messaging.queues
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
    {
      ledgerAccount: ledgerRepos.ledgerAccount,
      ...journalEntryRepos,
    },
    ledgerDomainServices.assetAccount,
    journalEntryDomainServices.journalEntry,
    currencyDomainServices.exchangeRate,
    services.repo
  ),
};

export default ledgerUseCases;
