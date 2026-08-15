import { Writable } from 'node:stream';

import * as winston from 'winston';

import { ILogFields } from '@shared/types/observability.types';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

import { makeLogger } from '@infra/observability/logger';

function makeOutputTransport(output: string[]) {
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output.push(chunk.toString());
      callback();
    },
  });

  return new winston.transports.Stream({ stream });
}

function parseRecord(output: string[]): Record<string, unknown> {
  return JSON.parse(output.join('').trim()) as Record<string, unknown>;
}

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits one canonical JSON record with numeric fields outside local', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appContext: mockAppContext,
      appEnv: 'production',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });
    mockAppContext.get.mockImplementation(() => {
      throw new Error('No active store');
    });

    logger.info('http.request.completed', {
      durationMs: 42,
      responseSizeBytes: 128,
      outcome: 'success',
    });

    const record = parseRecord(output);

    expect(record).toEqual(
      expect.objectContaining({
        level: 'info',
        event: 'http.request.completed',
        service: 'test-service',
        environment: 'production',
        version: '1.2.3',
        durationMs: 42,
        responseSizeBytes: 128,
        outcome: 'success',
      })
    );
    expect(typeof record.timestamp).toBe('string');
    expect(typeof record.durationMs).toBe('number');
    expect(record.correlationId).toBeUndefined();
    expect(output).toHaveLength(1);
    expect(output[0]).not.toContain('\u001b[');
  });

  it('adds safe context and protects logger-owned fields', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appContext: mockAppContext,
      appEnv: 'test',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });
    mockAppContext.get.mockReturnValue({
      correlationId: 'active-correlation',
      idempotencyKey: '',
    });

    logger.warn('queue.job.processing_failed', {
      timestamp: 'spoofed',
      level: 'debug',
      event: 'spoofed.event.value',
      service: 'spoofed-service',
      environment: 'local',
      version: '9.9.9',
      correlationId: 'spoofed-correlation',
      traceId: 'spoofed-trace',
      spanId: 'spoofed-span',
    });

    expect(parseRecord(output)).toEqual(
      expect.objectContaining({
        level: 'warn',
        event: 'queue.job.processing_failed',
        service: 'test-service',
        environment: 'test',
        version: '1.2.3',
        correlationId: 'active-correlation',
      })
    );
    expect(parseRecord(output).timestamp).not.toBe('spoofed');
    expect(parseRecord(output).traceId).toBeUndefined();
    expect(parseRecord(output).spanId).toBeUndefined();
  });

  it('normalizes errors and recursively redacts sensitive fields', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appEnv: 'staging',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });
    const error = Object.assign(
      new Error('Failed authentication with token: secret_abc123'),
      {
        errorKey: 'auth_error_invalid_token',
        cause: { userId: 'private-user-id' },
        amount: 100,
      }
    );

    logger.error('observability.error.reported', {
      error,
      nested: {
        password: 'my-password',
        url: '/api/auth?token=secret123&state=xyz',
      },
    });

    const record = parseRecord(output);
    const normalizedError = record.error as Record<string, unknown>;
    const nested = record.nested as Record<string, unknown>;

    expect(normalizedError.name).toBe('Error');
    expect(normalizedError.message).toContain('token: [REDACTED]');
    expect(normalizedError.message).not.toContain('secret_abc123');
    expect(normalizedError.stack).toEqual(expect.any(String));
    expect(normalizedError).toEqual({
      name: 'Error',
      message: expect.any(String),
      stack: expect.any(String),
      errorKey: 'auth_error_invalid_token',
    });
    expect(record.errorKey).toBe('auth_error_invalid_token');
    expect(nested.password).toBe('[REDACTED]');
    expect(nested.url).toBe('[REDACTED]');
  });

  it('preserves log messages without serializing plain-object errors', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appEnv: 'production',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });

    logger.error('http.request.failed', {
      message: 'Request processing failed',
      error: { reason: 'upstream unavailable' },
    });

    expect(parseRecord(output)).toEqual(
      expect.objectContaining({
        message: 'Request processing failed',
        error: {
          name: 'UnknownError',
          message: 'A non-Error value was thrown (type: object)',
        },
      })
    );
    expect(JSON.stringify(parseRecord(output))).not.toContain(
      'upstream unavailable'
    );
    expect(parseRecord(output).errorKey).toBeUndefined();
  });

  it('keeps local output readable', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appContext: mockAppContext,
      appEnv: 'local',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });
    mockAppContext.get.mockReturnValue({
      correlationId: 'active-correlation',
      idempotencyKey: '',
    });

    logger.debug('runtime.server.started', {
      message: 'Listening for requests',
      port: 3000,
    });

    const localOutput = output.join('');

    expect(localOutput).toContain('runtime.server.started');
    expect(localOutput).toContain('Listening for requests');
    expect(localOutput).toContain('"port":3000');
    expect(localOutput).toContain('"correlationId":"active-correlation"');
    expect(localOutput).not.toContain('"service":');
    expect(localOutput).not.toContain('"environment":');
    expect(localOutput).not.toContain('"version":');
    expect(localOutput.trimStart()).not.toMatch(/^\{/);
  });

  it('handles local records with omitted or malformed runtime fields', () => {
    const output: string[] = [];
    const logger = makeLogger({
      appEnv: 'local',
      service: 'test-service',
      version: '1.2.3',
      transport: makeOutputTransport(output),
    });

    logger.debug('runtime.server.started');
    logger.debug('runtime.server.completed', null as unknown as ILogFields);

    const localOutput = output.join('');

    expect(localOutput).toContain('runtime.server.started');
    expect(localOutput).toContain('runtime.server.completed');
  });
});
