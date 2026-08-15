import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

import safeGetCorrelationId from '@infra/observability/helpers/get-correlation-id';

describe('safeGetCorrelationId', () => {
  const validCorrelationId = '0198ad49-0f4a-7709-a5bf-2f7cfbaea7c4';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the active correlation ID', () => {
    mockAppContext.get.mockReturnValue({
      correlationId: validCorrelationId,
      idempotencyKey: '',
    });

    expect(safeGetCorrelationId(mockAppContext)).toBe(validCorrelationId);
  });

  it('returns undefined for a malformed contextual correlation ID', () => {
    mockAppContext.get.mockReturnValue({
      correlationId: 'private.person@example.com',
      idempotencyKey: '',
    });

    expect(safeGetCorrelationId(mockAppContext)).toBeUndefined();
  });

  it('returns undefined without throwing when no store is active', () => {
    mockAppContext.get.mockImplementation(() => {
      throw new Error('No active store');
    });

    expect(() => safeGetCorrelationId(mockAppContext)).not.toThrow();
    expect(safeGetCorrelationId(mockAppContext)).toBeUndefined();
  });

  it('does not initialize or mutate context to generate a replacement ID', () => {
    mockAppContext.get.mockReturnValue({
      correlationId: 'malformed-correlation',
      idempotencyKey: '',
    });

    safeGetCorrelationId(mockAppContext);

    expect(mockAppContext.init).not.toHaveBeenCalled();
    expect(mockAppContext.set).not.toHaveBeenCalled();
  });
});
