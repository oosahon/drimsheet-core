import IUserPreferencesRepo from '../user-preferences.repo';

const mockUserPreferencesRepo: jest.Mocked<IUserPreferencesRepo> = {
  findById: jest.fn(),
};

export default mockUserPreferencesRepo;
