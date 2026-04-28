import makeAccountingEntityService from '../../domain/accounting/services/accounting-entity.service';
import makeAssetPostingAccountService from '../../domain/ledger/services/asset-account.service';
import makeUserPreferencesService from '../../domain/user/services/user-preferences.service';
import repos from '../persistence/repos';

const userPreferences = makeUserPreferencesService(repos.userPreferences);
const accountingEntity = makeAccountingEntityService(repos.accountingEntity);

const assetPostingAccount = makeAssetPostingAccountService(
  repos.ledgerAccount,
  accountingEntity
);

const domainServices = Object.freeze({
  userPreferences,
  accountingEntity,
  assetPostingAccount,
});

export default domainServices;
