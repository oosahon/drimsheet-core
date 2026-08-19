import IUserPreferencesService from '@app/user/contracts/user-preferences.service.contract';

const mockUserPreferencesService: jest.Mocked<IUserPreferencesService> = {
  create: jest.fn(),
  setLastActiveAccountingEntity: jest.fn(),
};

export default mockUserPreferencesService;
