import IUserPreferencesAppService from '@app/user/contracts/user-preferences-app.service.contract';

const mockUserPreferencesAppService: jest.Mocked<IUserPreferencesAppService> = {
  setActiveAccountingEntity: jest.fn(),
  getActiveAccountingEntity: jest.fn(),
};

export default mockUserPreferencesAppService;
