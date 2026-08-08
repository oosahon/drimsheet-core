import ILogger from '@shared/contracts/logger.contract';

const mockLogger: jest.Mocked<ILogger> = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

export default mockLogger;
