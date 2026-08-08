import makeAccountsBootstrapService from '../../../app/ledger/services/accounts-bootstrap.service';
import makeLedgerAccountBalancePropagationService from '../../../app/ledger/services/ledger-account-balance-propagation.service';
import makeLedgerAccountPersistenceService from '../../../app/ledger/services/ledger-account-persistence.service';
import makeCashAccountService from '../../../domain/ledger/services/asset-account/cash-account.service';
import makeReceivablesAccountService from '../../../domain/ledger/services/asset-account/receivables-account.service';
import makeEquityAccountService from '../../../domain/ledger/services/equity-account/equity-account.service';
import makePayablesAccountService from '../../../domain/ledger/services/liability-account/payables.service';
import makeShortTermLoanService from '../../../domain/ledger/services/liability-account/short-term-loan.service';
import makeSuspenseAccountService from '../../../domain/ledger/services/suspense-account/suspense-account.service';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import { repoService } from './repo';

export const cashAccountService = makeCashAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const receivablesAccountService = makeReceivablesAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const suspenseAccountService = makeSuspenseAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const payablesAccountService = makePayablesAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const shortTermLoanAccountService = makeShortTermLoanService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const equityAccountService = makeEquityAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

export const ledgerAccountPersistenceService =
  makeLedgerAccountPersistenceService({
    ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    repoService,
  });

export const accountsBootstrapService = makeAccountsBootstrapService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  cashAccountService,
  receivablesAccountService,
  suspenseAccountService,
  payablesAccountService,
  shortTermLoanAccountService,
  equityAccountService,
});

export const ledgerAccountBalancePropagationService =
  makeLedgerAccountBalancePropagationService({
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
    reporter: observability.reporter,
  });
