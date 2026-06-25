import { IMoney } from '../../../../../shared/types/money.types';
import numberUtils from '../../../../../shared/utils/number';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import { IExchangeRate } from '../../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../../currency/value-objects/exchange-rate.vo';
import fxLotAcquisitionError from '../../errors/fx-lot-acquisition.error';

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
    throw new fxLotAcquisitionError.InvalidQuantity({ quantity });
  }
}

function validateCostBasis(costBasis: unknown) {
  if (!isValidMoney(costBasis) || costBasis.amount <= 0n) {
    throw new fxLotAcquisitionError.InvalidCostBasis({ costBasis });
  }
}

function validateOfficialRate(
  officialRate: IExchangeRate | null,
  officialRateId: number | null
) {
  const hasOfficialRate = officialRate !== null;
  const hasOfficialRateId = officialRateId !== null;

  if (hasOfficialRate !== hasOfficialRateId) {
    throw new fxLotAcquisitionError.MismatchedOfficialRate({
      officialRate,
      officialRateId,
    });
  }

  if (officialRate) {
    exchangeRateValue.validate(officialRate);
  }

  if (officialRateId !== null) {
    numberUtils.validateInteger(
      officialRateId,
      fxLotAcquisitionError.InvalidOfficialRateId
    );
    numberUtils.validatePositiveNumber(
      officialRateId,
      fxLotAcquisitionError.InvalidOfficialRateId
    );
  }
}

const fxLotAcquisitionEntityHelpers = Object.freeze({
  isValidMoney,
  validateQuantity,
  validateCostBasis,
  validateOfficialRate,
});

export default fxLotAcquisitionEntityHelpers;
