import makeExchangeRateAppService from '../../app/currency/services/exchange-rate.service';
import exchangeRateRepo from '../persistence/repos/currency/exchange-rate.repo.impl';

const exchangeRate = makeExchangeRateAppService(exchangeRateRepo);

const currencyServices = Object.freeze({
  exchangeRate,
});

export default currencyServices;
