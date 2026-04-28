import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import IUserPreferencesService from '../../../domain/user/types/user-preferences.service.types';

const userPreferences: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  create: jest.fn(),
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const assetAccount: jest.Mocked<IAssetAccountService> = {
  createPettyCashAccount: jest.fn(),
};

const mockDomainServices = Object.freeze({
  userPreferences,
  accountingEntity,
  assetAccount,
});

export default mockDomainServices;
