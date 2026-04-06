import IUserRepo from '../../../../domain/user/repos/user.repo';

export const mockUserRepo: jest.Mocked<IUserRepo> = {
  save: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};

export default mockUserRepo;
