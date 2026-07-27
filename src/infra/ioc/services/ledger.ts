import makeAccountsBootstrapService from '../../../app/ledger/services/accounts-bootstrap.service';
import makeLedgerAccountPersistenceService from '../../../app/ledger/services/ledger-account-persistence.service';
import makeAssetAccountService from '../../../domain/ledger/asset-account/services/asset-account.service';
import makeEquityAccountService from '../../../domain/ledger/equity-account/services/equity-account.service';
import makeExpenseAccountService from '../../../domain/ledger/expense-account/services/expense-account.service';
import makeLiabilityAccountService from '../../../domain/ledger/liability-account/services/liability-account.service';
import makeRevenueAccountService from '../../../domain/ledger/revenue-account/services/revenue-account.service';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo';

const assetAccount = makeAssetAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const liabilityAccount = makeLiabilityAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const equityAccount = makeEquityAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const revenueAccount = makeRevenueAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const expenseAccount = makeExpenseAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const persistence = makeLedgerAccountPersistenceService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  repoService,
});
const accountsBootstrap = makeAccountsBootstrapService({
  assetAccountService: assetAccount,
  liabilityAccountService: liabilityAccount,
  equityAccountService: equityAccount,
  revenueAccountService: revenueAccount,
  expenseAccountService: expenseAccount,
});

const ledgerServices = Object.freeze({
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,
  persistence,
  accountsBootstrap,
});

export default ledgerServices;
