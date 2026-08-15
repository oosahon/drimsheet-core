import ILogger from '@shared/contracts/logger.contract';

import IExchangeRateIngestion from '@app/money/contracts/exchange-rate-ingestion.contract';

interface IDependencies {
  logger: ILogger;
  usecase: (
    payload: IExchangeRateIngestion['message']['payload']
  ) => Promise<void>;
}

export default function makeExchangeRateIngestionWorker(deps: IDependencies) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    deps.logger.info('exchange_rate.ingestion.started');

    await deps.usecase(payload);

    deps.logger.info('exchange_rate.ingestion.completed', {
      outcome: 'success',
    });
  };
}
