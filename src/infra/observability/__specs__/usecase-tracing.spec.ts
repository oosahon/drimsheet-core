import tracer from '@infra/integrations/sentry/sentry-tracer';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';

jest.mock('@infra/integrations/sentry/sentry-tracer', () => ({
  __esModule: true,
  default: {
    startSpan: jest.fn(),
  },
}));

describe('use-case tracing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(tracer.startSpan)
      .mockImplementation((_options, operation) => operation());
  });

  it('wraps arguments and return values in one named application span', () => {
    const useCase = jest.fn((first: number, second: number) => first + second);
    const tracedUseCase = makeTracedUseCase(
      'counterparty.createCounterpartyUseCase',
      useCase
    );

    expect(tracedUseCase(20, 22)).toBe(42);
    expect(useCase).toHaveBeenCalledWith(20, 22);
    expect(tracer.startSpan).toHaveBeenCalledWith(
      {
        name: 'counterparty.createCounterpartyUseCase',
        operation: 'app.usecase',
      },
      expect.any(Function)
    );
  });

  it('preserves rejected and synchronous failures', async () => {
    const synchronousError = new Error('synchronous failure');
    const asynchronousError = new Error('asynchronous failure');
    const synchronousUseCase = makeTracedUseCase('auth.logoutUseCase', () => {
      throw synchronousError;
    });
    const asynchronousUseCase = makeTracedUseCase(
      'auth.loginWithEmailUseCase',
      async () => Promise.reject(asynchronousError)
    );

    expect(synchronousUseCase).toThrow(synchronousError);
    await expect(asynchronousUseCase()).rejects.toBe(asynchronousError);
  });
});
