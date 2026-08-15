import IAppContext from '@app/context/contracts/app-context.contract';

export const mockClientSession = {
  setRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
};

const mockAppContext = {
  init: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
} satisfies jest.Mocked<IAppContext>;

export default mockAppContext;
