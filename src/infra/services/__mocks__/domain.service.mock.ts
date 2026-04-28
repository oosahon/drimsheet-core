import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IUserPreferencesService from '../../../domain/user/types/user-preferences.service.types';

const userPreferences: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  create: jest.fn(),
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const mockDomainServices = Object.freeze({
  userPreferences,
  accountingEntity,
});

export default mockDomainServices;
