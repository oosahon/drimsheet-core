import makeAdjustLedgerAccountBalanceUseCase from '../../../app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreatePettyCashAccountUseCase from '../../../app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '../../../app/ledger/usecases/get-account-transactions.usecase';
import makeGetLedgerAccountUseCase from '../../../app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '../../../app/ledger/usecases/get-ledger-accounts.usecase';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import services from '../../services';
import bookkeepingServices from '../../services/bookkeeping.service';
import ledgerDomainServices from '../../services/domain/ledger.domain.service';
import fxCostBasisService from '../../services/fx-lot-cost-basis.service';
import currencyServices from '../../services/money.service';

const ledgerUseCases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase({
    appContext: appContext,
    reporter: observability.reporter,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  }),

  getLedgerAccount: makeGetLedgerAccountUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    reporter: observability.reporter,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  }),

  adjustLedgerAccountBalance: makeAdjustLedgerAccountBalanceUseCase({
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
  }),

  getAccountTransactions: makeGetAccountTransactionsUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountService: ledgerDomainServices.ledgerAccount,
    accountTransactionQueryRepo: ledgerRepos.queries.accountTransaction,
  }),

  createPettyCashAccount: makeCreatePettyCashAccountUseCase({
    appContext: appContext,
    eventBus: messaging.eventBus,
    assetAccountService: ledgerDomainServices.assetAccount,
    openingBalanceEntryService: bookkeepingServices.openingBalanceEntry,
    journalEntryPersistenceService: bookkeepingServices.journalEntryPersistence,
    repoService: services.repo,
    ledgerAccountPersistenceService: ledgerDomainServices.persistence,
    fxCostBasisPersistenceService: fxCostBasisService.persistence,
    fxCostBasisService: fxCostBasisService.domain,
    exchangeRateService: currencyServices.exchangeRate,
  }),
};

export default ledgerUseCases;
