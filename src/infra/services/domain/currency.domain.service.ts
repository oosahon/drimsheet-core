import makeExchangeRateService from '../../../domain/currency/services/exchange-rate.service';
import currencyRepos from '../../persistence/repos/currency';

const exchangeRate = makeExchangeRateService(currencyRepos.exchangeRate);

const currencyDomainServices = Object.freeze({
  exchangeRate,
});

export default currencyDomainServices;
