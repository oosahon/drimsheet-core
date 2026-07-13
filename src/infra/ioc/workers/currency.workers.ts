import makeExchangeRateIngestionWorker from '../../../app/currency/workers/exchange-rate-ingestion.worker';
import observability from '../../observability';
import currencyUseCase from '../usecases/currency.usecases';

const currencyWorkers = {
  exchangeRateIngestion: makeExchangeRateIngestionWorker({
    reporter: observability.reporter,
    logger: observability.logger,
    ingestExchangeRate: currencyUseCase.ingest,
  }),
};

export default currencyWorkers;
