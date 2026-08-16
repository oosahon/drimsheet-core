import { Request, Response } from 'express';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';

import { getLedgerAccountBalanceAdjustmentQueue } from '@infra/messaging/queues/ledger-account-balance.queue';
import { getTransactionalEmailQueue } from '@infra/messaging/queues/transactional-email.queue';
import {
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

  it('exports every configured queue with one metadata declaration per family', async () => {
    const transactionalEmailQueue = {
      exportPrometheusMetrics: jest
        .fn()
        .mockResolvedValue(makeQueueExport('transactional-email')),
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

  it('does not construct queues or a listener when the port is disabled', () => {
    const server = startBullMQMetricsServer(0, mockLogger);

    expect(server).toBeUndefined();
    expect(getTransactionalEmailQueue).not.toHaveBeenCalled();
    expect(getLedgerAccountBalanceAdjustmentQueue).not.toHaveBeenCalled();
  });
});
