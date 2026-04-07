import IRequestContext from '../request-context.contract';

const mockRequestContext: jest.Mocked<IRequestContext> = {
  init: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

export default mockRequestContext;
