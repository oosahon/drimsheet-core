import dateUtils from '../../../../shared/utils/date';
import numberUtils from '../../../../shared/utils/number';
import stringUtils from '../../../../shared/utils/string';
import { AppError } from '../../../../shared/value-objects/error';
import currencyEntity from '../../entities/currency.entity';
import {
  EExchangeRateType,
  IExchangeRate,
  UExchangeRateType,
} from '../../types/exchange-rate.types';

function validateType(value: UExchangeRateType) {
  if (!Object.values(EExchangeRateType).includes(value)) {
    throw new AppError('Invalid exchange rate type', { cause: value });
  }
}

function validateCurrencyPair(
  params: Pick<
    IExchangeRate,
    'currencyPair' | 'baseCurrencyCode' | 'targetCurrencyCode'
  >
) {
  stringUtils.validateStringWithinRange(params.currencyPair, {
    min: 7,
    max: 7,
  });

  const [base, target] = params.currencyPair.split('/');

  const itMatches =
    base === params.baseCurrencyCode && target === params.targetCurrencyCode;

  if (!itMatches) {
    throw new AppError('Invalid currency pair', { cause: params });
  }

  currencyEntity.validateCode(base);
  currencyEntity.validateCode(target);
}

function validate(exchangeRate: IExchangeRate) {
  validateCurrencyPair(exchangeRate);
  numberUtils.validatePositiveNumber(exchangeRate.rate, 'Invalid rate');
  dateUtils.validateDateIsNotInTheFuture(exchangeRate.asOf);
  stringUtils.validateStringWithinRange(exchangeRate.source, {
    min: 3,
    max: 100,
  });

  validateType(exchangeRate.type);
  dateUtils.validateDate(exchangeRate.createdAt);
  dateUtils.validateDate(exchangeRate.updatedAt);
}

const exchangeRateValueHelpers = Object.freeze({
  validate,
  validateType,
  validateCurrencyPair,
});

export default exchangeRateValueHelpers;
