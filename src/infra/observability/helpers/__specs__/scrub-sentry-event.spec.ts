import { ErrorEvent } from '@sentry/node';

import scrubSentryEvent from '@infra/observability/helpers/scrub-sentry-event';

describe('scrubSentryEvent', () => {
  it('removes automatic PII and preserves bounded runtime diagnostics', () => {
    const event: ErrorEvent = {
      type: undefined,
      event_id: 'event-id',
      timestamp: 123,
      start_timestamp: 120,
      level: 'error',
      platform: 'node',
      logger: 'app',
      release: '1.2.3',
      dist: 'server',
      environment: 'production',
      sdk: { name: 'sentry.javascript.node', version: '10.43.0' },
      modules: { express: '5.1.0' },
      debug_meta: { images: [] },
      message:
        'Failure for private.person@example.com with private-refresh-token',
      logentry: {
        message: 'token=private-token for private.person@example.com',
        params: [{ payload: 'private' }],
      },
      user: {
        id: 'private-user-id',
        email: 'private.person@example.com',
        ip_address: '192.0.2.1',
      },
      request: {
        method: 'POST',
        url: 'https://api.example.com/users/private-id?token=private',
        data: { email: 'private.person@example.com' },
        query_string: 'token=private',
        cookies: { session: 'private' },
        env: { REMOTE_ADDR: '192.0.2.1' },
        headers: { authorization: 'Bearer private' },
      },
      exception: {
        values: [
          {
            type: 'CauseError',
            value: 'Cause for private.person@example.com',
          },
          {
            type: 'TypeError',
            value: 'Failure for private.person@example.com with token=private',
            mechanism: {
              type: 'generic',
              handled: true,
              synthetic: false,
              data: { target: 'private.person@example.com' },
            },
            stacktrace: {
              frames_omitted: [0, 1],
              frames: [
                {
                  filename: '/app/private.person@example.com.ts',
                  function: 'run',
                  module: 'worker',
                  platform: 'node',
                  lineno: 10,
                  colno: 2,
                  in_app: true,
                  abs_path: '/app/private.person@example.com.ts',
                  context_line: 'throw new Error("private@example.com")',
                  pre_context: ['const email = "private@example.com";'],
                  post_context: ['return private@example.com;'],
                  instruction_addr: '0x1',
                  addr_mode: 'rel:0',
                  debug_id: 'debug-id',
                  vars: { email: 'private@example.com' },
                  module_metadata: { payload: 'private' },
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          type: 'http',
          level: 'info',
          event_id: 'breadcrumb-id',
          category: 'request',
          message:
            'POST https://api.example.com/users/private-id?email=private@example.com',
          data: {
            url: 'https://api.example.com/users/private-id',
            headers: { authorization: 'Bearer private' },
          },
          timestamp: 122,
        },
      ],
      contexts: {
        trace: {
          trace_id: 'trace-id',
          span_id: 'span-id',
          parent_span_id: 'parent-span-id',
          op: 'http.server',
          status: 'internal_error',
          origin: 'auto.http',
          data: { url: 'https://api.example.com/private' },
          tags: { userId: 'private-user-id' },
        },
        app: {
          app_name: 'purple-ledger-core',
          app_version: '1.2.3',
          app_start_time: '2026-08-15T00:00:00.000Z',
          build_type: 'release',
          app_memory: 100,
          free_memory: 50,
          privateField: 'private',
        },
        runtime: { name: 'node', version: '22.0.0', private: 'private' },
        os: {
          name: 'linux',
          version: '1',
          build: 'build',
          kernel_version: 'kernel',
          private: 'private',
        },
        device: { device_unique_identifier: 'private-device-id' },
        response: { headers: { 'set-cookie': 'private' } },
      },
      extra: {
        operation: 'finalize-password-reset-token',
        queue: 'test-queue',
        transport: 'bullmq',
        attempt: 2,
        source: 'worker',
        signal: 'SIGTERM',
        subscriber: 'rabbitmq',
        eventType: 'domain:test:event',
        eventTypes: ['domain:test:first', 'domain:test:second'],
        method: 'POST',
        scope: 'login-with-email',
        used: 6,
        limit: 5,
        correlationId: 'correlation-id',
        errorKey: 'auth_error_token_invalid_unauthorized',
        _raw: { email: 'private@example.com' },
        cause: { userId: 'private-user-id' },
        payload: { amount: 100 },
      },
      tags: { userId: 'private-user-id' },
      transaction: '/users/private-user-id',
      spans: [
        {
          span_id: 'span-id',
          trace_id: 'trace-id',
          data: { url: 'https://api.example.com/private' },
          start_timestamp: 120,
          timestamp: 121,
        },
      ],
      threads: { values: [] },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed).toEqual(
      expect.objectContaining({
        event_id: 'event-id',
        timestamp: 123,
        start_timestamp: 120,
        level: 'error',
        platform: 'node',
        logger: 'app',
        release: '1.2.3',
        dist: 'server',
        environment: 'production',
        sdk: event.sdk,
        modules: event.modules,
        debug_meta: event.debug_meta,
        message: 'Failure for [REDACTED] with [REDACTED]',
        logentry: {
          message: 'token=[REDACTED] for [REDACTED]',
        },
        request: { method: 'POST' },
      })
    );
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.tags).toBeUndefined();
    expect(scrubbed.transaction).toBeUndefined();
    expect(scrubbed.spans).toBeUndefined();
    expect(scrubbed.threads).toBeUndefined();
    expect(scrubbed.request).toEqual({ method: 'POST' });
    expect(scrubbed.exception?.values).toHaveLength(1);
    expect(scrubbed.exception?.values?.[0]).toEqual(
      expect.objectContaining({
        type: 'TypeError',
        value: 'Failure for [REDACTED] with token=[REDACTED]',
        mechanism: {
          type: 'generic',
          handled: true,
          synthetic: false,
        },
      })
    );
    const frame = scrubbed.exception?.values?.[0].stacktrace?.frames?.[0];
    expect(frame?.filename).toBe('[REDACTED]');
    expect(frame?.context_line).toBeUndefined();
    expect(frame?.pre_context).toBeUndefined();
    expect(frame?.post_context).toBeUndefined();
    expect(frame).not.toHaveProperty('vars');
    expect(frame).not.toHaveProperty('module_metadata');
    expect(scrubbed.breadcrumbs).toEqual([
      {
        type: 'http',
        level: 'info',
        event_id: 'breadcrumb-id',
        category: 'request',
        message: 'POST [REDACTED_URL]',
        timestamp: 122,
      },
    ]);
    expect(scrubbed.contexts).toEqual({
      trace: {
        trace_id: 'trace-id',
        span_id: 'span-id',
        parent_span_id: 'parent-span-id',
        op: 'http.server',
        status: 'internal_error',
        origin: 'auto.http',
      },
      app: {
        app_name: 'purple-ledger-core',
        app_version: '1.2.3',
        app_start_time: '2026-08-15T00:00:00.000Z',
        build_type: 'release',
        app_memory: 100,
        free_memory: 50,
      },
      runtime: { name: 'node', version: '22.0.0' },
      os: {
        name: 'linux',
        version: '1',
        build: 'build',
        kernel_version: 'kernel',
      },
    });
    expect(scrubbed.extra).toEqual({
      operation: 'finalize-password-reset-token',
      queue: 'test-queue',
      transport: 'bullmq',
      attempt: 2,
      source: 'worker',
      signal: 'SIGTERM',
      subscriber: 'rabbitmq',
      eventType: 'domain:test:event',
      eventTypes: ['domain:test:first', 'domain:test:second'],
      method: 'POST',
      scope: 'login-with-email',
      used: 6,
      limit: 5,
      correlationId: 'correlation-id',
      errorKey: 'auth_error_token_invalid_unauthorized',
    });
    expect(JSON.stringify(scrubbed)).not.toContain(
      'private.person@example.com'
    );
    expect(JSON.stringify(scrubbed)).not.toContain('private-user-id');
    expect(JSON.stringify(scrubbed)).not.toContain('192.0.2.1');
    expect(JSON.stringify(scrubbed)).not.toContain('Bearer private');
  });

  it('returns a minimal safe exception when scrubbing fails', () => {
    const malformedEvent = new Proxy(
      {},
      {
        get() {
          throw new Error('private.person@example.com');
        },
      }
    ) as ErrorEvent;

    expect(scrubSentryEvent(malformedEvent)).toEqual({
      type: undefined,
      exception: {
        values: [
          {
            type: 'UnknownError',
            value: 'Sentry event could not be scrubbed safely',
          },
        ],
      },
    });
  });

  it('allowlists SDK, module, and debug-image fields', () => {
    const event = {
      type: undefined,
      sdk: {
        name: 'sentry.javascript.node',
        version: '10.43.0',
        integrations: ['http', 42],
        packages: [
          {
            name: '@sentry/node',
            version: '10.43.0',
            dependencies: { private: 'private' },
          },
          { name: '@sentry/invalid' },
        ],
        private: 'private',
      },
      modules: {
        express: '5.1.0',
        invalid: 42,
      },
      debug_meta: {
        images: [
          null,
          { type: 'sourcemap' },
          {
            type: 'sourcemap',
            debug_id: 'debug-id',
            code_id: 'code-id',
            code_file: '/app/private.person@example.com.js',
            debug_file: '/app/private.person@example.com.map',
            image_addr: '0x1',
            image_size: 100,
            private: 'private',
          },
        ],
      },
    } as unknown as ErrorEvent;

    expect(scrubSentryEvent(event)).toEqual({
      type: undefined,
      sdk: {
        name: 'sentry.javascript.node',
        version: '10.43.0',
        integrations: ['http'],
        packages: [{ name: '@sentry/node', version: '10.43.0' }],
      },
      modules: { express: '5.1.0' },
      debug_meta: {
        images: [
          {
            type: 'sourcemap',
            debug_id: 'debug-id',
            code_id: 'code-id',
            code_file: '[REDACTED]',
            debug_file: '[REDACTED]',
            image_addr: '0x1',
            image_size: 100,
          },
        ],
      },
    });
  });

  it('handles an empty event deterministically', () => {
    expect(scrubSentryEvent({ type: undefined })).toEqual({ type: undefined });
  });
});
