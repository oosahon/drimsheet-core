import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import currencyEntity from '../entities/currency.entity';
import { IExchangeRate } from '../types/exchange-rate.types';
import helpers from './helpers/exchange-rate.helpers';

function make(payload: TCreationOmits<IExchangeRate, 'currencyPair'>) {
  helpers.validateType(payload.type);
  dateUtils.validateDateIsNotInTheFuture(payload.asOf);

  const baseCurrencyCode = currencyEntity.normalizeCode(
    payload.baseCurrencyCode
  );
  const targetCurrencyCode = currencyEntity.normalizeCode(
    payload.targetCurrencyCode
  );

  const currencyPair = `${baseCurrencyCode}/${targetCurrencyCode}`;
  const source = stringUtils.sanitizeAndValidate(payload.source, {
    min: 3,
    max: 100,
  });

  const timestamp = new Date();

  const exchangeRate: IExchangeRate = {
    currencyPair,
    baseCurrencyCode,
    targetCurrencyCode,
    rate: payload.rate,
    asOf: payload.asOf,
    source,
    type: payload.type,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return Object.freeze(exchangeRate);
}

const exchangeRateValue = Object.freeze({
  make,
  ...helpers,
});

export default exchangeRateValue;
