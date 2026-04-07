import ILogger from '../logger.contract';

export const MockLogger: jest.Mocked<ILogger> = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
