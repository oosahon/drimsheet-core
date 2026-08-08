import makeAdjustLedgerAccountBalanceUseCase from '../../../app/ledger/usecases/adjust-ledger-account-balance.usecase';
import makeCreateBankAccountUseCase from '../../../app/ledger/usecases/create-bank-account.usecase';
import makeCreatePettyCashAccountUseCase from '../../../app/ledger/usecases/create-petty-cash-account.usecase';
import makeGetAccountTransactionsUseCase from '../../../app/ledger/usecases/get-account-transactions.usecase';
import makeGetBanksUseCase from '../../../app/ledger/usecases/get-banks.usecase';
import makeGetLedgerAccountUseCase from '../../../app/ledger/usecases/get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from '../../../app/ledger/usecases/get-ledger-accounts.usecase';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import { accountingPeriodService } from '../services/accounting';
import {
  fxCostBasisLotService,
  fxCostBasisPersistenceService,
} from '../services/fx-lot-cost-basis';
import {
  journalEntryPersistenceService,
  journalEntryService,
} from '../services/journal-entry';
import {
  cashAccountService,
  ledgerAccountBalancePropagationService,
  ledgerAccountPersistenceService,
} from '../services/ledger';
import { exchangeRateService } from '../services/money';
import { repoService } from '../services/repo';

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
