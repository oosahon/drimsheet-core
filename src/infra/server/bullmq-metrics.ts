import { Server } from 'node:http';

import express, { Express, Request, Response } from 'express';

import ILogger from '@shared/contracts/logger.contract';
import { ELogOutcome } from '@shared/types/observability.types';

import { getLedgerAccountBalanceAdjustmentQueue } from '@infra/messaging/queues/ledger-account-balance.queue';
import { getTransactionalEmailQueue } from '@infra/messaging/queues/transactional-email.queue';

interface IBullMQMetricsQueue {
  exportPrometheusMetrics(): Promise<string>;
}

function mergePrometheusExports(exports: readonly string[]): string {
  const metadata = new Set<string>();
  const mergedLines: string[] = [];

  exports.forEach((queueExport) => {
    queueExport.split('\n').forEach((line) => {
      if (!line) return;

      const isMetadata =
        line.startsWith('# HELP ') || line.startsWith('# TYPE ');

      if (isMetadata) {
        if (metadata.has(line)) return;
        metadata.add(line);
      }

      mergedLines.push(line);
    });
  });

  return `${mergedLines.join('\n')}\n`;
}

export function makeBullMQMetricsHandler(
  queues: readonly IBullMQMetricsQueue[],
  logger: ILogger
): (_req: Request, res: Response) => Promise<void> {
  return async (_req, res) => {
    try {
      const queueExports = await Promise.all(
        queues.map((queue) => queue.exportPrometheusMetrics())
      );

      res
        .status(200)
        .type('text/plain; version=0.0.4')
        .send(mergePrometheusExports(queueExports));
    } catch (error) {
      logger.warn('queue.metrics.scrape_failed', {
        outcome: ELogOutcome.Failure,
        error,
      });
      res.status(503).type('text/plain').send('BullMQ metrics unavailable\n');
    }
  };
}

export function createBullMQMetricsApplication(
  queues: readonly IBullMQMetricsQueue[],
  logger: ILogger
): Express {
  const application = express();

  application.get('/metrics', makeBullMQMetricsHandler(queues, logger));

  return application;
}

export function startBullMQMetricsServer(
  port: number,
  logger: ILogger
): Server | undefined {
  if (port <= 0) return undefined;

  const queues = [
    getTransactionalEmailQueue(),
    getLedgerAccountBalanceAdjustmentQueue(),
  ];
  const application = createBullMQMetricsApplication(queues, logger);
  const server = application.listen(port, () => {
    logger.info('runtime.bullmq_metrics.started', {
      port,
      outcome: ELogOutcome.Success,
    });
  });

  server.on('error', (error) => {
    logger.warn('runtime.bullmq_metrics.start_failed', {
      port,
      outcome: ELogOutcome.Failure,
      error,
    });
  });

  return server;
}
