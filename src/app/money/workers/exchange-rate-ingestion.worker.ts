import ILogger from '../../../shared/contracts/logger.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';

interface IDependencies {
  reporter: IReporter;
  logger: ILogger;
  ingestExchangeRate: (
    payload: IExchangeRateIngestion['message']['payload']
  ) => Promise<void>;
}

export default function makeExchangeRateIngestionWorker(deps: IDependencies) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    deps.logger.info('Initiating currency exchange rate ingestion');

    await deps.ingestExchangeRate(payload).catch(deps.reporter.report);

    deps.logger.info('Currency exchange rate ingested successfully');
  };
}
