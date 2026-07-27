import makeAccountsBootstrapService from '../../../app/ledger/services/accounts-bootstrap.service';
import makeLedgerAccountPersistenceService from '../../../app/ledger/services/ledger-account-persistence.service';
import makeAssetAccountService from '../../../domain/ledger/asset-account/services/asset-account.service';
import ledgerRepos from '../../persistence/repos/ledger';
import repoService from './repo';

const assetAccount = makeAssetAccountService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});
const persistence = makeLedgerAccountPersistenceService({
  ledgerAccountBalanceRepo: ledgerRepos.ledgerAccountBalance,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  repoService,
});
const accountsBootstrap = makeAccountsBootstrapService({
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
});

const ledgerServices = Object.freeze({
  assetAccount,
  persistence,
  accountsBootstrap,
});

export default ledgerServices;
