import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';

import journalLineError from '@domain/journal-entry/errors/journal-line.error';
import {
  EJournalSide,
  UJournalSide,
} from '@domain/journal-entry/types/journal-line.types';
import { ICurrency } from '@domain/money/types/currency.types';
import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import { IMoney } from '@domain/money/types/money.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

function validateSide(side: UJournalSide) {
  if (!Object.values(EJournalSide).includes(side)) {
    throw new journalLineError.InvalidSide({ side });
  }
}

function validateCounterpartyId(counterpartyId: TEntityId | null) {
  if (counterpartyId !== null) {
    stringUtils.validateUUID(
      counterpartyId,
      journalLineError.InvalidCounterpartyId
    );
  }
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
      exchangeRate,
    });
  }

  if (isSameCurrency && isNullExchangeRate) {
    return;
  }

  if (isNullExchangeRate) {
    throw new journalLineError.MissingExchangeRate({
      exchangeRate,
    });
  }

  const isValidBase = amount.currency.code === exchangeRate.baseCurrencyCode;
  if (!isValidBase) {
    throw new journalLineError.MismatchedExchangeRateBase({
      exchangeRate,
    });
  }

  const isValidTarget =
    exchangeRate.targetCurrencyCode === functionalCurrency.code;
  if (!isValidTarget) {
    throw new journalLineError.MismatchedExchangeRateTarget({
      exchangeRate,
    });
  }

  exchangeRateValue.validate(exchangeRate);
}

const journalLineValidation = Object.freeze({
  validateSide,
  validateCounterpartyId,
  validateExchangeRate,
});

export default journalLineValidation;
