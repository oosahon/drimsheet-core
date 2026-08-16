import express from 'express';
import request from 'supertest';

import { postgres } from '@infra/config/postgres.config';
import { makeRuntimeHealth } from '@infra/server/health';

jest.mock('../../config/postgres.config', () => ({
  postgres: {
    $client: {
      query: jest.fn(),
    },
  },
}));

function makeApplication(runtimeHealth: ReturnType<typeof makeRuntimeHealth>) {
  return express().use(runtimeHealth.router);
}

describe('runtime health', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('keeps liveness dependency-free and minimal', async () => {
    const runtimeHealth = makeRuntimeHealth();

    const response = await request(makeApplication(runtimeHealth)).get(
      '/health/live'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(postgres.$client.query).not.toHaveBeenCalled();
  });

  it('stays unready before startup and after startup failure', async () => {
    const runtimeHealth = makeRuntimeHealth();
    const app = makeApplication(runtimeHealth);

    const startingResponse = await request(app).get('/health/ready');
    runtimeHealth.markStartupFailed();
    const failedResponse = await request(app).get('/health/ready');

    expect(startingResponse.status).toBe(503);
    expect(failedResponse.status).toBe(503);
    expect(startingResponse.body).toEqual({ status: 'unavailable' });
    expect(failedResponse.body).toEqual({ status: 'unavailable' });
    expect(postgres.$client.query).not.toHaveBeenCalled();
  });

  it('becomes ready only after startup and a bounded PostgreSQL probe', async () => {
    jest.mocked(postgres.$client.query).mockResolvedValueOnce({} as never);
    const runtimeHealth = makeRuntimeHealth();
    runtimeHealth.markStartupComplete();

    const response = await request(makeApplication(runtimeHealth)).get(
      '/health/ready'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(postgres.$client.query).toHaveBeenCalledWith({
      text: 'SELECT 1',
      query_timeout: 1_000,
    });
    expect(Object.isFrozen(runtimeHealth)).toBe(true);
  });

  it('returns minimal unavailability when PostgreSQL cannot be reached', async () => {
    jest
      .mocked(postgres.$client.query)
      .mockRejectedValueOnce(new Error('private') as never);
    const runtimeHealth = makeRuntimeHealth();
    runtimeHealth.markStartupComplete();

    const response = await request(makeApplication(runtimeHealth)).get(
      '/health/ready'
    );

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
    expect(JSON.stringify(response.body)).not.toContain('private');
  });
});
