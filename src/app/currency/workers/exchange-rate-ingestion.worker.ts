import ILogger from '../../../shared/contracts/logger.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';
import currencyUseCase from '../usecases';

interface IDependencies {
  reporter: IReporter;
  logger: ILogger;
}

export default function makeExchangeRateIngestionWorker(deps: IDependencies) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    deps.logger.info('Initiating currency exchange rate ingestion');

    await currencyUseCase.ingest(payload).catch(deps.reporter.report);

    deps.logger.info('Currency exchange rate ingested successfully');
  };
}
