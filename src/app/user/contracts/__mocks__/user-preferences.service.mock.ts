import IUserPreferencesService from '@app/user/contracts/user-preferences.service.contract';

const mockUserPreferencesService: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

export default mockUserPreferencesService;
