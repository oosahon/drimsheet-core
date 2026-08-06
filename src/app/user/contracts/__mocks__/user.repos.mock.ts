import IUserHistoryRepo from '../../../../domain/user/repos/user-history.repo';
import IUserPreferencesRepo from '../../../../domain/user/repos/user-preferences.repo';
import IUserRepo from '../../../../domain/user/repos/user.repo';

export const mockUserHistoryRepo: jest.Mocked<IUserHistoryRepo> = {
  save: jest.fn(),
};

export const mockUserPreferencesRepo: jest.Mocked<IUserPreferencesRepo> = {
  findById: jest.fn(),
};

export const mockUserRepo: jest.Mocked<IUserRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};
