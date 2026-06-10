import makeLedgerAccountBalanceService from '../../../domain/bookkeeping/services/account-balance.service';
import makeBookkeepingService from '../../../domain/bookkeeping/services/bookkeeping.service';
import bookkeepingRepos from '../../persistence/repos/bookkeeping';
import ledgerRepos from '../../persistence/repos/ledger';

const bookkeeping = makeBookkeepingService(
  ledgerRepos.ledgerAccount,
  bookkeepingRepos.ledgerAccountBalance
);

const accountBalance = makeLedgerAccountBalanceService(
  bookkeepingRepos.ledgerAccountBalance
);

const bookkeepingDomainServices = Object.freeze({
  bookkeeping,
  accountBalance,
});

export default bookkeepingDomainServices;
