import makeLedgerAccountBalanceService from '../../../domain/ledger/services/account-balance.service';
import ledgerRepos from '../../persistence/repos/ledger';

const ledgerAccountBalanceService = makeLedgerAccountBalanceService(
  ledgerRepos.ledgerAccountBalance
);

const ledgerBalanceDomainServices = Object.freeze({
  accountBalance: ledgerAccountBalanceService,
});

export default ledgerBalanceDomainServices;
