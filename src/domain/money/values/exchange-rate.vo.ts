import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import currencyEntity from '../entities/currency.entity';
import currencyError from '../errors/currency.error';
import { IExchangeRate } from '../types/exchange-rate.types';
import helpers from './helpers/exchange-rate.helpers';

function make(payload: TCreationOmits<IExchangeRate, 'currencyPair'>) {
  helpers.validateType(payload.type);
  dateUtils.validateDateIsNotInTheFuture(
    payload.asOf,
    currencyError.InvalidValue
  );

  const baseCurrencyCode = currencyEntity.normalizeCode(
    payload.baseCurrencyCode
  );
  currencyEntity.validateCode(baseCurrencyCode);

  const targetCurrencyCode = currencyEntity.normalizeCode(
    payload.targetCurrencyCode
  );
  currencyEntity.validateCode(targetCurrencyCode);

  const currencyPair = helpers.getCurrencyPair(
    baseCurrencyCode,
    targetCurrencyCode
  );
  const source = stringUtils.sanitizeAndValidate(
    payload.source,
    {
      min: 1,
      max: 100,
    },
    currencyError.InvalidValue
  );

  const exchangeRate: IExchangeRate = {
    currencyPair,
    baseCurrencyCode,
    targetCurrencyCode,
    rate: payload.rate,
    asOf: payload.asOf,
    source,
    type: payload.type,
    createdAt: new Date(),
  };

  return Object.freeze(exchangeRate);
}

const exchangeRateValue = Object.freeze({
  make,
  ...helpers,
});

export default exchangeRateValue;
