import { IMoney } from '../../../../shared/types/money.types';
import stringUtils from '../../../../shared/utils/string';
import { AppError } from '../../../../shared/value-objects/error';
import { ICurrency } from '../../../currency/types/currency.types';
import { IExchangeRate } from '../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import {
  EEJournalEntrySide,
  UJournalEntrySide,
} from '../../types/journal-entry.types';

function validateSide(side: UJournalEntrySide) {
  if (!Object.values(EEJournalEntrySide).includes(side)) {
    throw new AppError('Invalid side', { cause: side });
  }
}

function getDescription(value: string) {
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
    throw new AppError('Exchange rate is not supported for same currency.', {
      cause: exchangeRate,
    });
  }

  if (isSameCurrency && isNullExchangeRate) {
    return;
  }

  if (isNullExchangeRate) {
    throw new AppError('Exchange rate is required for different currencies.', {
      cause: exchangeRate,
    });
  }

  const isValidBase = amount.currency.code === exchangeRate.baseCurrencyCode;
  if (!isValidBase) {
    throw new AppError("Exchange rate base doesn't match amount currency.", {
      cause: exchangeRate,
    });
  }

  const isValidTarget =
    exchangeRate.targetCurrencyCode === functionalCurrency.code;
  if (!isValidTarget) {
    throw new AppError(
      "Exchange rate target doesn't match functional currency.",
      {
        cause: exchangeRate,
      }
    );
  }

  exchangeRateValue.validate(exchangeRate);
}

const journalLineItemHelpers = Object.freeze({
  validateSide,
  getDescription,
  validateExchangeRate,
});

export default journalLineItemHelpers;
