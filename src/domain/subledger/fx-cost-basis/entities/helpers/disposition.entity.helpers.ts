import { IMoney } from '../../../../../domain/money/types/money.types';
import moneyValue from '../../../../../domain/money/value-objects/money.vo';
import { IExchangeRate } from '../../../../money/types/exchange-rate.types';
import exchangeRateValue from '../../../../money/value-objects/exchange-rate.vo';
import FxCostBasisLotDispositionError from '../../errors/disposition.error';

function isValidMoney(value: unknown): value is IMoney {
  try {
    moneyValue.validate(value as IMoney);
    return true;
  } catch {
    return false;
  }
}

function validateQuantity(quantity: unknown) {
  if (!isValidMoney(quantity) || quantity.amount <= 0n) {
    throw new FxCostBasisLotDispositionError.InvalidQuantity({ quantity });
  }
}

function validateCostBasisConsumed(costBasisConsumed: unknown) {
  if (!isValidMoney(costBasisConsumed) || costBasisConsumed.amount <= 0n) {
    throw new FxCostBasisLotDispositionError.InvalidCostBasisConsumed({
      costBasisConsumed,
    });
  }
}

function validateProceeds(proceeds: unknown) {
  if (!isValidMoney(proceeds) || proceeds.amount <= 0n) {
    throw new FxCostBasisLotDispositionError.InvalidProceeds({ proceeds });
  }
}

function validateRealizedGainLoss(realizedGainLoss: unknown) {
  if (!isValidMoney(realizedGainLoss)) {
    throw new FxCostBasisLotDispositionError.InvalidRealizedGainLoss({
      realizedGainLoss,
    });
  }
}

function validateOfficialRate(officialRate: IExchangeRate | null) {
  if (officialRate) {
    exchangeRateValue.validate(officialRate);
  }
}

const FxCostBasisLotDispositionEntityHelpers = Object.freeze({
  isValidMoney,
  validateQuantity,
  validateCostBasisConsumed,
  validateProceeds,
  validateRealizedGainLoss,
  validateOfficialRate,
});

export default FxCostBasisLotDispositionEntityHelpers;
