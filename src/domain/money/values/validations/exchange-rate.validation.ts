import dateUtils from '@shared/utils/date';
import numberUtils from '@shared/utils/number';
import stringUtils from '@shared/utils/string';

import currencyEntity from '@domain/money/entities/currency.entity';
import currencyError from '@domain/money/errors/currency.error';
import exchangeRateError from '@domain/money/errors/exchange-rate.error';
import {
  EExchangeRateType,
  IExchangeRate,
  UExchangeRateType,
} from '@domain/money/types/exchange-rate.types';

function validateType(value: UExchangeRateType) {
  if (!Object.values(EExchangeRateType).includes(value)) {
    throw new exchangeRateError.InvalidType({ value });
  }
}

function validateCurrencyPair(
  params: Pick<
    IExchangeRate,
    'currencyPair' | 'baseCurrencyCode' | 'targetCurrencyCode'
  >
) {
  stringUtils.validateStringWithinRange(
    params.currencyPair,
    {
      min: 7,
      max: 7,
    },
    currencyError.InvalidValue
  );

  const [base, target] = params.currencyPair.split('/');

  const itMatches =
    base === params.baseCurrencyCode && target === params.targetCurrencyCode;

  if (!itMatches) {
    throw new exchangeRateError.InvalidPair({ params });
  }

  currencyEntity.validateCode(base);
  currencyEntity.validateCode(target);
}

function validate(exchangeRate: IExchangeRate) {
  validateCurrencyPair(exchangeRate);
  numberUtils.validatePositiveNumber(
    exchangeRate.rate,
    currencyError.InvalidValue
  );
  dateUtils.validateDateIsNotInTheFuture(
    exchangeRate.asOf,
    currencyError.InvalidValue
  );
  stringUtils.validateStringWithinRange(
    exchangeRate.source,
    {
      min: 3,
      max: 100,
    },
    currencyError.InvalidValue
  );

  validateType(exchangeRate.type);
  dateUtils.validateDate(exchangeRate.createdAt, currencyError.InvalidValue);
}

const exchangeRateValidation = Object.freeze({
  validate,
  validateType,
  validateCurrencyPair,
});

export default exchangeRateValidation;
