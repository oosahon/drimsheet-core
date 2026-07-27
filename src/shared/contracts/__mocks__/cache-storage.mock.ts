import { ICacheStorage } from '../cache-storage.contract';

const mockCacheStorage: jest.Mocked<ICacheStorage> = {
  set: jest.fn(),
  setIfNotExists: jest.fn(),
  deleteIfValueMatches: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

export default mockCacheStorage;
