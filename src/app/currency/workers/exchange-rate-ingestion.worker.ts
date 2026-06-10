import ILogger from '../../shared/contracts/logger.contract';
import IReporter from '../../shared/contracts/reporter.contract';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';
import currencyUseCase from '../usecases';

export default function makeExchangeRateIngestionWorker(
  reporter: IReporter,
  logger: ILogger
) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    logger.info('Initiating currency exchange rate ingestion');

    await currencyUseCase.ingest(payload).catch(reporter.report);

    logger.info('Currency exchange rate ingested successfully');
  };
}
