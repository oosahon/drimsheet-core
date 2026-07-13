import IUserPreferencesService from '../../types/user-preferences.service.types';

const userPreferences: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const mockUserDomainServices = Object.freeze({
  userPreferences,
});

export default mockUserDomainServices;
