import ITracer from '@shared/contracts/tracer.contract';

const mockTracer = {
  continueTrace: jest.fn((_carrier, operation) => operation()),
  getActiveTrace: jest.fn(),
  getPropagationCarrier: jest.fn(() => ({})),
  startRootSpan: jest.fn((_options, operation) => operation()),
  startSpan: jest.fn((_options, operation) => operation()),
} as unknown as jest.Mocked<ITracer>;

export default mockTracer;
