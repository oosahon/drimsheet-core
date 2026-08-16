import tracer from '@infra/observability/tracer';

export function makeTracedUseCase<TArguments extends unknown[], TResult>(
  spanName: string,
  useCase: (...args: TArguments) => TResult
): (...args: TArguments) => TResult {
  return (...args) =>
    tracer.startSpan({ name: spanName, operation: 'app.usecase' }, () =>
      useCase(...args)
    );
}
