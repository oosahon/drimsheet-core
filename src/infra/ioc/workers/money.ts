import makeExchangeRateIngestionWorker from '../../../app/money/workers/exchange-rate-ingestion.worker';
import observability from '../../observability';
import { exchangeRateUseCases } from '../usecases/money';

const currencyWorkers = {
  exchangeRateIngestion: makeExchangeRateIngestionWorker({
    reporter: observability.reporter,
    logger: observability.logger,
    ingestExchangeRate: exchangeRateUseCases.ingest,
  }),
};

export default currencyWorkers;
