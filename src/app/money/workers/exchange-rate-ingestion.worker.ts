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

    try {
      await deps.ingestExchangeRate(payload);
    } catch (error) {
      deps.reporter.report(error, {
        type: 'exchange-rate-ingestion',
        correlationId: payload.correlation_id,
      });
      throw error;
    }

    deps.logger.info('Currency exchange rate ingested successfully');
  };
}
