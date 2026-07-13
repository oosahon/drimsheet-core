import IRequestContext from '../request-context.contract';

export const mockClientSession = {
  setRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
};

const mockRequestContext: jest.Mocked<IRequestContext> = {
  init: jest.fn(),
  get: jest.fn().mockReturnValue({
    correlationId: '854e4567-e89b-42d3-a456-426614174001',
    idempotencyKey: 'mock-idempotency-key',
    user: null,
    accountingEntityType: 'individual',
    clientSession: mockClientSession,
  }),
  set: jest.fn(),
};

export default mockRequestContext;
