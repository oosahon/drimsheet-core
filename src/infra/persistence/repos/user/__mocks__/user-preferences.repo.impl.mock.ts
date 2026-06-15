import IUserPreferencesRepo from '../../../../../domain/user/repos/user-preferences.repo';

const mockUserPreferencesRepo: jest.Mocked<IUserPreferencesRepo> = {
  findById: jest.fn(),
};

export default mockUserPreferencesRepo;
