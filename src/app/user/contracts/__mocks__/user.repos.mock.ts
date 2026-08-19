import IUserHistoryRepo from '@domain/user/repos/user-history.repo';
import IUserRepo from '@domain/user/repos/user.repo';

import IUserPreferencesRepo from '@app/user/contracts/user-preferences.repo.contract';

export const mockUserHistoryRepo: jest.Mocked<IUserHistoryRepo> = {
  save: jest.fn(),
};

export const mockUserPreferencesRepo: jest.Mocked<IUserPreferencesRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

export const mockUserRepo: jest.Mocked<IUserRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};
