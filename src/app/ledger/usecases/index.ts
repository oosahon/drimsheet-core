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
