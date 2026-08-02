import makeExchangeRateIngestionWorker from '../../../app/money/workers/exchange-rate-ingestion.worker';
import observability from '../../observability';
import { ingestExchangeRateUseCase } from '../usecases/money';

export const exchangeRateIngestionWorker = makeExchangeRateIngestionWorker({
  reporter: observability.reporter,
  logger: observability.logger,
  ingestExchangeRate: ingestExchangeRateUseCase,
});
