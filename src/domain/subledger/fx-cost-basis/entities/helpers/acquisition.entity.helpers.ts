import { IMoney } from '../../../../../shared/types/money.types';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import { IExchangeRate } from '../../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../../currency/value-objects/exchange-rate.vo';
import fxCostBasisLotAcquisitionError from '../../errors/acquisition.error';

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
    throw new fxCostBasisLotAcquisitionError.InvalidQuantity({ quantity });
  }
}

function validateCostBasis(costBasis: unknown) {
  if (!isValidMoney(costBasis) || costBasis.amount <= 0n) {
    throw new fxCostBasisLotAcquisitionError.InvalidCostBasis({ costBasis });
  }
}

function validateOfficialRate(officialRate: IExchangeRate | null) {
  if (officialRate) {
    exchangeRateValue.validate(officialRate);
  }
}

const FxCostBasisLotAcquisitionEntityHelpers = Object.freeze({
  isValidMoney,
  validateQuantity,
  validateCostBasis,
  validateOfficialRate,
});

export default FxCostBasisLotAcquisitionEntityHelpers;
