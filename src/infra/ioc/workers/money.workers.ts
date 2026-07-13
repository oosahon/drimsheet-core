import makeExchangeRateIngestionWorker from '../../../app/money/workers/exchange-rate-ingestion.worker';
import observability from '../../observability';
import currencyUseCase from '../usecases/money.usecases';

const currencyWorkers = {
  exchangeRateIngestion: makeExchangeRateIngestionWorker({
    reporter: observability.reporter,
    logger: observability.logger,
    ingestExchangeRate: currencyUseCase.ingest,
  }),
};

export default currencyWorkers;
