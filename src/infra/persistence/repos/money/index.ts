import currencyRepo from './currency.repo.impl';
import exchangeRateRepo from './exchange-rate.repo.impl';

const currencyRepos = {
  currency: currencyRepo,
  exchangeRate: exchangeRateRepo,
};

export default currencyRepos;
