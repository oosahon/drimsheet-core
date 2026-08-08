import makeAdjustLedgerAccountBalanceUseCase from '@app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreateBankAccountUseCase from '@app/ledger/usecases/create-bank-account.usecase';
import makeCreatePettyCashAccountUseCase from '@app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '@app/ledger/usecases/get-account-transactions.usecase';
import makeGetBanksUseCase from '@app/ledger/usecases/get-banks.usecase';
import makeGetLedgerAccountUseCase from '@app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '@app/ledger/usecases/get-ledger-accounts.usecase';

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
  ledgerAccountBalancePropagationService,
  ledgerAccountPersistenceService,
} from '@infra/ioc/services/ledger';
import { exchangeRateService } from '@infra/ioc/services/money';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import observability from '@infra/observability';
import ledgerRepos from '@infra/persistence/repos/ledger';
import appContext from '@infra/runtime/app-context';

export const getBanksUseCase = makeGetBanksUseCase();

export const getLedgerAccountsUseCase = makeGetLedgerAccountsUsecase({
  appContext: appContext,
  reporter: observability.reporter,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
});

export const getLedgerAccountUseCase = makeGetLedgerAccountUseCase({
  appContext: appContext,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  reporter: observability.reporter,
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
});

export const adjustLedgerAccountBalanceUseCase =
  makeAdjustLedgerAccountBalanceUseCase({
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
  });

export const getAccountTransactionsUseCase = makeGetAccountTransactionsUseCase({
  appContext: appContext,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  accountTransactionQueryRepo: ledgerRepos.queries.accountTransaction,
});

export const createPettyCashAccountUseCase = makeCreatePettyCashAccountUseCase({
  appContext: appContext,
  eventBus: messaging.eventBus,
  cashAccountService,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  accountingPeriodService,
  journalEntryService,
  journalEntryPersistenceService,
  balancePropagationService: ledgerAccountBalancePropagationService,
  repoService,
  ledgerAccountPersistenceService,
  fxCostBasisPersistenceService,
  fxCostBasisService: fxCostBasisLotService,
  exchangeRateService,
});

export const createBankAccountUseCase = makeCreateBankAccountUseCase({
  appContext: appContext,
  eventBus: messaging.eventBus,
  cashAccountService,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  accountingPeriodService,
  bankAccountRepo: ledgerRepos.bankAccount,
  journalEntryService,
  journalEntryPersistenceService,
  balancePropagationService: ledgerAccountBalancePropagationService,
  repoService,
  ledgerAccountPersistenceService,
  fxCostBasisPersistenceService,
  fxCostBasisService: fxCostBasisLotService,
  exchangeRateService,
});
