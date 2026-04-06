import IRequestContext from '../request-context.contract';

const mockRequestContext: jest.Mocked<IRequestContext> = {
  init: jest.fn(),
  get: jest.fn(),
};

export default mockRequestContext;
