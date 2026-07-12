import makeGetCurrenciesUseCase from '../../../app/currency/usecases/get-currencies.usecase';
import makeIngestExchangeRateUseCase from '../../../app/currency/usecases/ingest-exchange-rate.usecase';
import appContext from '../../../app/shared/context';
import observability from '../../observability';
import currencyRepos from '../../persistence/repos/currency';
import services from '../../services';

const currencyUseCase = Object.freeze({
  getAll: makeGetCurrenciesUseCase({
    currencyRepo: currencyRepos.currency,
    requestContext: appContext.request,
  }),

  ingest: makeIngestExchangeRateUseCase({
    exchangeRateRepo: currencyRepos.exchangeRate,
    repoService: services.repo,
    logger: observability.logger,
  }),
});

export default currencyUseCase;
