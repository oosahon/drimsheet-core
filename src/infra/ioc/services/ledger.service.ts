import makeAccountsBootstrapService from '../../../app/ledger/services/accounts-bootstrap.service';
import makeAssetAccountService from '../../../domain/ledger/asset-account/services/asset-account.service';
import makeEquityAccountService from '../../../domain/ledger/equity-account/services/equity-account.service';
import makeExpenseAccountService from '../../../domain/ledger/expense-account/services/expense-account.service';
import makeLiabilityAccountService from '../../../domain/ledger/liability-account/services/liability-account.service';
import makeRevenueAccountService from '../../../domain/ledger/revenue-account/services/revenue-account.service';
import makeLedgerAccountPersistenceService from '../../../domain/ledger/shared/services/ledger-account-persistence.service';
import makeLedgerAccountService from '../../../domain/ledger/shared/services/ledger-account.service';
import observability from '../../observability';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo.service';

const ledgerAccount = makeLedgerAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
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
  logger: observability.logger,
});
const accountsBootstrap = makeAccountsBootstrapService({
  assetAccountService: assetAccount,
  liabilityAccountService: liabilityAccount,
  equityAccountService: equityAccount,
  revenueAccountService: revenueAccount,
  expenseAccountService: expenseAccount,
});

const ledgerServices = Object.freeze({
  ledgerAccount,
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,
  persistence,
  accountsBootstrap,
});

export default ledgerServices;
