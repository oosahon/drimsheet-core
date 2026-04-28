import IUserPreferencesService from '../../../domain/user/types/user-preferences.service.types';

const mockUserPreferencesService: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const mockDomainServices = Object.freeze({
  userPreferences: mockUserPreferencesService,
});

export default mockDomainServices;
