import IHasher from '@shared/contracts/hasher.contract';

const mockHasher: jest.Mocked<IHasher> = {
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
};

export default mockHasher;
