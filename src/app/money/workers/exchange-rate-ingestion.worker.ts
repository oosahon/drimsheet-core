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
    deps.logger.info('Initiating currency exchange rate ingestion');

    await deps.usecase(payload);

    deps.logger.info('Currency exchange rate ingested successfully');
  };
}
