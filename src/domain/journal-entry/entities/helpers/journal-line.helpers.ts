import { IMoney } from '../../../../shared/types/money.types';
import stringUtils from '../../../../shared/utils/string';
import { ICurrency } from '../../../currency/types/currency.types';
import { IExchangeRate } from '../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import journalLineError from '../../errors/journal-line.errors';
import { EJournalSide, UJournalSide } from '../../types/journal-line.types';

function validateSide(side: UJournalSide) {
  if (!Object.values(EJournalSide).includes(side)) {
    throw new journalLineError.InvalidSide({ cause: side });
  }
}

function getDescription(value?: string | null) {
  if (!value) {
    return null;
  }

  return stringUtils.sanitizeAndValidate(value, {
    max: 100,
    min: 1,
  });
}

interface IValidateExchangeRatePayload {
  amount: IMoney;
  functionalCurrency: ICurrency;
  exchangeRate: IExchangeRate | null;
}

function validateExchangeRate(payload: IValidateExchangeRatePayload) {
  const { amount, functionalCurrency, exchangeRate } = payload;

  const isSameCurrency = amount.currency.code === functionalCurrency.code;
  const isNullExchangeRate = exchangeRate === null;

  if (isSameCurrency && !isNullExchangeRate) {
    throw new journalLineError.UnsupportedExchangeRate({
      cause: exchangeRate,
    });
  }

  if (isSameCurrency && isNullExchangeRate) {
    return;
  }

  if (isNullExchangeRate) {
    throw new journalLineError.MissingExchangeRate({
      cause: exchangeRate,
    });
  }

  const isValidBase = amount.currency.code === exchangeRate.baseCurrencyCode;
  if (!isValidBase) {
    throw new journalLineError.MismatchedExchangeRateBase({
      cause: exchangeRate,
    });
  }

  const isValidTarget =
    exchangeRate.targetCurrencyCode === functionalCurrency.code;
  if (!isValidTarget) {
    throw new journalLineError.MismatchedExchangeRateTarget({
      cause: exchangeRate,
    });
  }

  exchangeRateValue.validate(exchangeRate);
}

const journalLineEntityHelpers = Object.freeze({
  validateSide,
  getDescription,
  validateExchangeRate,
});

export default journalLineEntityHelpers;
