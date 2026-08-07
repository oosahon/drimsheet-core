import makeAccountsBootstrapService from '../../../app/ledger/services/accounts-bootstrap.service';
import makeLedgerAccountBalancePropagationService from '../../../app/ledger/services/ledger-account-balance-propagation.service';
import makeLedgerAccountPersistenceService from '../../../app/ledger/services/ledger-account-persistence.service';
import makeCashAccountService from '../../../domain/ledger/services/cash-account.service';
import messaging from '../../messaging';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import { repoService } from './repo';

export const cashAccountService = makeCashAccountService({
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
});

export const ledgerAccountBalancePropagationService =
  makeLedgerAccountBalancePropagationService({
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
    reporter: observability.reporter,
  });
