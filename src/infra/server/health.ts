import { Router } from 'express';
import { QueryConfig } from 'pg';

import { postgres } from '@infra/config/postgres.config';

const POSTGRES_PROBE_TIMEOUT_MS = 1_000;

async function probePostgres(): Promise<void> {
  const query = {
    text: 'SELECT 1',
    query_timeout: POSTGRES_PROBE_TIMEOUT_MS,
  } as QueryConfig & { query_timeout: number };

  // pg supports per-query timeouts although the external type package omits it.
  await postgres.$client.query(query);
}

export function makeRuntimeHealth() {
  let startupState: 'starting' | 'ready' | 'failed' = 'starting';
  const router = Router();

  router.get('/health/live', (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.status(200).json({ status: 'ok' });
  });

  router.get('/health/ready', async (_request, response) => {
    response.set('Cache-Control', 'no-store');

    if (startupState !== 'ready') {
      response.status(503).json({ status: 'unavailable' });
      return;
    }

    try {
      await probePostgres();
      response.status(200).json({ status: 'ok' });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });

  return Object.freeze({
    markStartupComplete: () => {
      startupState = 'ready';
    },
    markStartupFailed: () => {
      startupState = 'failed';
    },
    router,
  });
}
