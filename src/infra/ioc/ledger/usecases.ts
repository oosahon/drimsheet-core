import makeAdjustLedgerAccountBalanceUseCase from '../../../app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreatePettyCashAccountUseCase from '../../../app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '../../../app/ledger/usecases/get-account-transactions.usecase';
import makeGetLedgerAccountUseCase from '../../../app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '../../../app/ledger/usecases/get-ledger-accounts.usecase';
import appContext from '../../../app/shared/context';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import services from '../../services';
import bookkeepingServices from '../../services/bookkeeping.service';
import currencyServices from '../../services/currency.service';
import ledgerDomainServices from '../../services/domain/ledger.domain.service';
import fxCostBasisService from '../../services/fx-lot-cost-basis.service';

const ledgerUseCases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase({
    requestContext: appContext.request,
    reporter: observability.reporter,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  }),

  getLedgerAccount: makeGetLedgerAccountUseCase({
    requestContext: appContext.request,
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
    requestContext: appContext.request,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountService: ledgerDomainServices.ledgerAccount,
    accountTransactionQueryRepo: ledgerRepos.queries.accountTransaction,
  }),

  createPettyCashAccount: makeCreatePettyCashAccountUseCase({
    requestContext: appContext.request,
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
