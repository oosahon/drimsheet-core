import makeExchangeRateAppService from '../../../app/money/services/exchange-rate.service';
import exchangeRateRepo from '../../persistence/repos/money/exchange-rate.repo.impl';

const exchangeRate = makeExchangeRateAppService({
  exchangeRateRepo,
});

const currencyServices = Object.freeze({
  exchangeRate,
});

export default currencyServices;
