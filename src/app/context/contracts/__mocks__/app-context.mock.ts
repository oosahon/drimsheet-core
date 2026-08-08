import IAppContext from '@app/context/contracts/app-context.contract';

export const mockClientSession = {
  setRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
};

const mockAppContext: jest.Mocked<IAppContext> = {
  init: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

export default mockAppContext;
