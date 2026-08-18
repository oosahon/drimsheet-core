import makeAdjustLedgerAccountBalanceUseCase from '@app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreateBankAccountUseCase from '@app/ledger/usecases/create-bank-account.usecase';
import makeCreatePettyCashAccountUseCase from '@app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '@app/ledger/usecases/get-account-transactions.usecase';
import makeGetBanksUseCase from '@app/ledger/usecases/get-banks.usecase';
import makeGetLedgerAccountUseCase from '@app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '@app/ledger/usecases/get-ledger-accounts.usecase';
import makeGetPermittedPostingAccountsUsecase from '@app/ledger/usecases/get-permitted-posting-accounts.usecase';

import { accountingPeriodService } from '@infra/ioc/services/accounting';
import {
  fxCostBasisLotService,
  fxCostBasisPersistenceService,
} from '@infra/ioc/services/fx-lot-cost-basis';
import {
  journalEntryPersistenceService,
  journalEntryService,
} from '@infra/ioc/services/journal-entry';
import {
  cashAccountService,
  ledgerAccountBalanceAdjustmentService,
  ledgerAccountBalanceEnrichmentService,
  ledgerAccountPersistenceService,
} from '@infra/ioc/services/ledger';
import { exchangeRateService } from '@infra/ioc/services/money';
import outboxService from '@infra/ioc/services/outbox';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import observability from '@infra/observability';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import journalEntryRepos from '@infra/persistence/repos/journal-entry';
import ledgerRepos from '@infra/persistence/repos/ledger';
import outboxRepo from '@infra/persistence/repos/outbox';
import appContext from '@infra/runtime/app-context';

export const getBanksUseCase = makeTracedUseCase(
  'ledger.getBanksUseCase',
  makeGetBanksUseCase()
);

export const getLedgerAccountsUseCase = makeTracedUseCase(
  'ledger.getLedgerAccountsUseCase',
  makeGetLedgerAccountsUsecase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    balanceEnrichmentService: ledgerAccountBalanceEnrichmentService,
  })
);

export const getPermittedPostingAccountsUseCase = makeTracedUseCase(
  'ledger.getPermittedPostingAccountsUseCase',
  makeGetPermittedPostingAccountsUsecase({
    appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    balanceEnrichmentService: ledgerAccountBalanceEnrichmentService,
  })
);

export const getLedgerAccountUseCase = makeTracedUseCase(
  'ledger.getLedgerAccountUseCase',
  makeGetLedgerAccountUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    balanceEnrichmentService: ledgerAccountBalanceEnrichmentService,
  })
);

export const adjustLedgerAccountBalanceUseCase = makeTracedUseCase(
  'ledger.adjustLedgerAccountBalanceUseCase',
  makeAdjustLedgerAccountBalanceUseCase({
    repoService,
    outboxRepo,
    journalEntryRepo: journalEntryRepos.journalEntry,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
    ledgerAccountBalanceAdjustmentService,
    reporter: observability.reporter,
  })
);

export const getAccountTransactionsUseCase = makeTracedUseCase(
  'ledger.getAccountTransactionsUseCase',
  makeGetAccountTransactionsUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    accountTransactionQueryRepo: ledgerRepos.queries.accountTransaction,
  })
);

export const createPettyCashAccountUseCase = makeTracedUseCase(
  'ledger.createPettyCashAccountUseCase',
  makeCreatePettyCashAccountUseCase({
    appContext: appContext,
    eventBus: messaging.eventBus,
    cashAccountService,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    accountingPeriodService,
    journalEntryService,
    journalEntryPersistenceService,
    outboxService,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
    repoService,
    ledgerAccountPersistenceService,
    fxCostBasisPersistenceService,
    fxCostBasisService: fxCostBasisLotService,
    exchangeRateService,
  })
);

export const createBankAccountUseCase = makeTracedUseCase(
  'ledger.createBankAccountUseCase',
  makeCreateBankAccountUseCase({
    appContext: appContext,
    eventBus: messaging.eventBus,
    cashAccountService,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    accountingPeriodService,
    bankAccountRepo: ledgerRepos.bankAccount,
    journalEntryService,
    journalEntryPersistenceService,
    outboxService,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
    repoService,
    ledgerAccountPersistenceService,
    fxCostBasisPersistenceService,
    fxCostBasisService: fxCostBasisLotService,
    exchangeRateService,
  })
);
