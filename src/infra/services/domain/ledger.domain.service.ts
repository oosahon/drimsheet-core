import makeAssetAccountService from '../../../domain/ledger/services/asset-account.service';
import makeEquityAccountService from '../../../domain/ledger/services/equity-account.service';
import makeExpenseAccountService from '../../../domain/ledger/services/expense-account.service';
import makeLedgerAccountService from '../../../domain/ledger/services/ledger-account.service';
import makeLiabilityAccountService from '../../../domain/ledger/services/liability-account.service';
import makeRevenueAccountService from '../../../domain/ledger/services/revenue-account.service';
import ledgerRepos from '../../persistence/repos/ledger';

const ledgerAccount = makeLedgerAccountService(ledgerRepos.ledgerAccount);
const assetAccount = makeAssetAccountService(ledgerRepos.ledgerAccount);
const liabilityAccount = makeLiabilityAccountService(ledgerRepos.ledgerAccount);
const equityAccount = makeEquityAccountService(ledgerRepos.ledgerAccount);
const revenueAccount = makeRevenueAccountService(ledgerRepos.ledgerAccount);
const expenseAccount = makeExpenseAccountService(ledgerRepos.ledgerAccount);

const ledgerDomainServices = Object.freeze({
  ledgerAccount,
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,
});

export default ledgerDomainServices;
