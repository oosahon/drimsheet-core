import observability from '../../../infra/observability';
import currencyRepos from '../../../infra/persistence/repos/currency';
import services from '../../../infra/services';
import appContext from '../../shared/context';
import makeGetCurrenciesUseCase from './get-currencies.usecase';
import makeIngestExchangeRateUseCase from './ingest-exchange-rate.usecase';

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
