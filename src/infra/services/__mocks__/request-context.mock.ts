import IRequestContext from '../../../app/shared/contracts/request-context.contract';

export const mockClientSession = {
  setRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
};

const mockRequestContext: jest.Mocked<IRequestContext> = {
  init: jest.fn(),
  get: jest.fn().mockReturnValue({
    correlationId: 'mock-correlation-id',
    idempotencyKey: 'mock-idempotency-key',
    user: null,
    accountingEntityType: 'individual',
    clientSession: mockClientSession,
  }),
  set: jest.fn(),
};

export default mockRequestContext;
