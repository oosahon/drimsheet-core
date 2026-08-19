import { Server } from 'node:http';

import express, { Express, Request, Response } from 'express';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';

import { getLedgerAccountBalanceAdjustmentQueue } from '@infra/messaging/queues/ledger-account-balance.queue';
import { getTransactionalEmailQueue } from '@infra/messaging/queues/transactional-email.queue';
import {
  createBullMQMetricsApplication,
  makeBullMQMetricsHandler,
  startBullMQMetricsServer,
} from '@infra/server/bullmq-metrics';

jest.mock('../../messaging/queues/ledger-account-balance.queue', () => ({
  getLedgerAccountBalanceAdjustmentQueue: jest.fn(),
}));

jest.mock('../../messaging/queues/transactional-email.queue', () => ({
  getTransactionalEmailQueue: jest.fn(),
}));

function makeQueueExport(queue: string) {
  return [
    '# HELP bullmq_job_count Number of jobs in the queue by state',
    '# TYPE bullmq_job_count gauge',
    `bullmq_job_count{queue="${queue}", state="waiting"} 2`,
    '# HELP bullmq_job_completed_total Total number of completed jobs',
    '# TYPE bullmq_job_completed_total counter',
    `bullmq_job_completed_total{queue="${queue}"} 5`,
    '# HELP bullmq_job_failed_total Total number of failed jobs',
    '# TYPE bullmq_job_failed_total counter',
    `bullmq_job_failed_total{queue="${queue}"} 1`,
  ].join('\n');
}

function makeResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('BullMQ metrics server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports every configured queue with one metadata declaration per family', async () => {
    const transactionalEmailQueue = {
      exportPrometheusMetrics: jest
        .fn()
        .mockResolvedValue(`${makeQueueExport('transactional-email')}\n`),
    };
    const ledgerBalanceQueue = {
      exportPrometheusMetrics: jest
        .fn()
        .mockResolvedValue(makeQueueExport('ledger-balance')),
    };
    const handler = makeBullMQMetricsHandler(
      [transactionalEmailQueue, ledgerBalanceQueue],
      mockLogger
    );
    const response = makeResponse();

    await handler({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.type).toHaveBeenCalledWith('text/plain; version=0.0.4');
    const metrics = jest.mocked(response.send).mock.calls[0][0] as string;
    expect(metrics).toContain(
      'bullmq_job_count{queue="transactional-email", state="waiting"} 2'
    );
    expect(metrics).toContain(
      'bullmq_job_count{queue="ledger-balance", state="waiting"} 2'
    );
    expect(metrics.match(/# HELP bullmq_job_count /g) ?? []).toHaveLength(1);
    expect(metrics.match(/# TYPE bullmq_job_count gauge/g) ?? []).toHaveLength(
      1
    );
    expect(
      metrics.match(/# HELP bullmq_job_completed_total /g) ?? []
    ).toHaveLength(1);
    expect(
      metrics.match(/# HELP bullmq_job_failed_total /g) ?? []
    ).toHaveLength(1);
    expect(transactionalEmailQueue.exportPrometheusMetrics).toHaveBeenCalled();
    expect(ledgerBalanceQueue.exportPrometheusMetrics).toHaveBeenCalled();
  });

  it('returns an unavailable response when any queue export fails', async () => {
    const exportError = new Error('Redis unavailable');
    const handler = makeBullMQMetricsHandler(
      [
        {
          exportPrometheusMetrics: jest.fn().mockRejectedValue(exportError),
        },
      ],
      mockLogger
    );
    const response = makeResponse();

    await handler({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.type).toHaveBeenCalledWith('text/plain');
    expect(response.send).toHaveBeenCalledWith('BullMQ metrics unavailable\n');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'queue.metrics.scrape_failed',
      {
        outcome: 'failure',
        error: exportError,
      }
    );
  });

  it('registers the metrics handler on the dedicated application route', () => {
    const queue = {
      exportPrometheusMetrics: jest
        .fn()
        .mockResolvedValue(makeQueueExport('transactional-email')),
    };
    const get = jest
      .spyOn(express.application, 'get')
      .mockImplementation(function (this: Express) {
        return this;
      });

    const application = createBullMQMetricsApplication([queue], mockLogger);

    expect(application).toBeDefined();
    expect(get).toHaveBeenCalledWith('/metrics', expect.any(Function));
  });

  it('does not construct queues or a listener when the port is disabled', () => {
    const server = startBullMQMetricsServer(0, mockLogger);

    expect(server).toBeUndefined();
    expect(getTransactionalEmailQueue).not.toHaveBeenCalled();
    expect(getLedgerAccountBalanceAdjustmentQueue).not.toHaveBeenCalled();
  });

  it('starts with both queues and reports listener lifecycle events', () => {
    const port = 9_464;
    const startError = new Error('Address unavailable');
    const serverOn = jest.fn<
      Server,
      [event: string, listener: (error: Error) => void]
    >();
    const server = { on: serverOn } as unknown as Server;
    serverOn.mockImplementation((_event, listener) => {
      listener(startError);

      return server;
    });
    const listen = jest
      .spyOn(express.application, 'listen')
      .mockImplementation((_port, callback) => {
        callback?.();

        return server;
      });
    const transactionalEmailQueue = {
      exportPrometheusMetrics: jest.fn(),
    } as unknown as ReturnType<typeof getTransactionalEmailQueue>;
    const ledgerBalanceQueue = {
      exportPrometheusMetrics: jest.fn(),
    } as unknown as ReturnType<typeof getLedgerAccountBalanceAdjustmentQueue>;
    jest
      .mocked(getTransactionalEmailQueue)
      .mockReturnValue(transactionalEmailQueue);
    jest
      .mocked(getLedgerAccountBalanceAdjustmentQueue)
      .mockReturnValue(ledgerBalanceQueue);

    const startedServer = startBullMQMetricsServer(port, mockLogger);

    expect(startedServer).toBe(server);
    expect(getTransactionalEmailQueue).toHaveBeenCalledTimes(1);
    expect(getLedgerAccountBalanceAdjustmentQueue).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(port, expect.any(Function));
    expect(mockLogger.info).toHaveBeenCalledWith(
      'runtime.bullmq_metrics.started',
      {
        port,
        outcome: 'success',
      }
    );
    expect(serverOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'runtime.bullmq_metrics.start_failed',
      {
        port,
        outcome: 'failure',
        error: startError,
      }
    );
  });
});
