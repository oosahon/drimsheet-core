import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

import safeGetCorrelationId from '@infra/observability/helpers/get-correlation-id';

describe('safeGetCorrelationId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the active correlation ID', () => {
    mockAppContext.get.mockReturnValue({
      correlationId: 'active-correlation',
      idempotencyKey: '',
    });

    expect(safeGetCorrelationId(mockAppContext)).toBe('active-correlation');
  });

  it('returns undefined without throwing when no store is active', () => {
    mockAppContext.get.mockImplementation(() => {
      throw new Error('No active store');
    });

    expect(() => safeGetCorrelationId(mockAppContext)).not.toThrow();
    expect(safeGetCorrelationId(mockAppContext)).toBeUndefined();
  });

  it('does not initialize or mutate context to generate a replacement ID', () => {
    mockAppContext.get.mockImplementation(() => {
      throw new Error('No active store');
    });

    safeGetCorrelationId(mockAppContext);

    expect(mockAppContext.init).not.toHaveBeenCalled();
    expect(mockAppContext.set).not.toHaveBeenCalled();
  });
});
