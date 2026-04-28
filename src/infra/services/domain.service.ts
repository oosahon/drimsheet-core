import makeAccountingEntityService from '../../domain/accounting/services/accounting-entity.service';
import makeAssetAccountService from '../../domain/ledger/services/asset-account.service';
import makeUserPreferencesService from '../../domain/user/services/user-preferences.service';
import repos from '../persistence/repos';

const userPreferences = makeUserPreferencesService(repos.userPreferences);
const accountingEntity = makeAccountingEntityService(repos.accountingEntity);

const assetAccount = makeAssetAccountService(
  repos.ledgerAccount,
  accountingEntity
);

const domainServices = Object.freeze({
  userPreferences,
  accountingEntity,
  assetAccount,
});

export default domainServices;
