import IUserPreferencesRepo from '../../../../domain/user/repos/user-preferences.repo';

export const MockUserPreferencesRepo: jest.Mocked<IUserPreferencesRepo> = {
  save: jest.fn(),
  findById: jest.fn(),
};

export default MockUserPreferencesRepo;
