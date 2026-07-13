import makeGetCurrenciesUseCase from '../../../app/money/usecases/get-currencies.usecase';
import makeIngestExchangeRateUseCase from '../../../app/money/usecases/ingest-exchange-rate.usecase';
import observability from '../../observability';
import currencyRepos from '../../persistence/repos/money';
import appContext from '../../runtime/app-context';
import repoService from '../services/repo.service';

const currencyUseCase = Object.freeze({
  getAll: makeGetCurrenciesUseCase({
    currencyRepo: currencyRepos.currency,
    appContext: appContext,
  }),

  ingest: makeIngestExchangeRateUseCase({
    exchangeRateRepo: currencyRepos.exchangeRate,
    repoService,
    logger: observability.logger,
  }),
});

export default currencyUseCase;
