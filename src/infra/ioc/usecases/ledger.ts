import makeAdjustLedgerAccountBalanceUseCase from '../../../app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreatePettyCashAccountUseCase from '../../../app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '../../../app/ledger/usecases/get-account-transactions.usecase';
import makeGetLedgerAccountUseCase from '../../../app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '../../../app/ledger/usecases/get-ledger-accounts.usecase';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import accountingServices from '../services/accounting';
import fxCostBasisService from '../services/fx-lot-cost-basis';
import journalEntryServices from '../services/journal-entry';
import ledgerServices from '../services/ledger';
import currencyServices from '../services/money';
import repoService from '../services/repo';

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
    accountTransactionQueryRepo: ledgerRepos.queries.accountTransaction,
  }),

  createPettyCashAccount: makeCreatePettyCashAccountUseCase({
    appContext: appContext,
    eventBus: messaging.eventBus,
    assetAccountService: ledgerServices.assetAccount,
    accountingPeriodService: accountingServices.accountingPeriod,
    openingBalanceEntryService: journalEntryServices.openingBalanceEntry,
    journalEntryPersistenceService:
      journalEntryServices.journalEntryPersistence,
    balancePropagationService: ledgerServices.balancePropagation,
    repoService,
    ledgerAccountPersistenceService: ledgerServices.persistence,
    fxCostBasisPersistenceService: fxCostBasisService.persistence,
    fxCostBasisService: fxCostBasisService.domain,
    exchangeRateService: currencyServices.exchangeRate,
  }),
};

export default ledgerUseCases;
