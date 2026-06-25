import { IMoney } from '../../../../../shared/types/money.types';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import fxLotError from '../../errors/fx-lot.error';
import { EFxLotStatus, UFxLotStatus } from '../../types/fx-lot.types';

function isValidStatus(status: unknown): status is UFxLotStatus {
  return Object.values(EFxLotStatus).includes(status as UFxLotStatus);
}

function validateStatus(status: unknown) {
  if (!isValidStatus(status)) {
    throw new fxLotError.InvalidStatus({ status });
  }
}

function isValidMoney(value: unknown): value is IMoney {
  try {
    moneyValue.validate(value as IMoney);
    return true;
  } catch {
    return false;
  }
}

function isPositiveMoney(value: IMoney) {
  return value.amount > 0n;
}

function isNonNegativeMoney(value: IMoney) {
  return value.amount >= 0n;
}

function validateOriginalQuantity(
  originalQuantity: unknown
): asserts originalQuantity is IMoney {
  if (!isValidMoney(originalQuantity) || !isPositiveMoney(originalQuantity)) {
    throw new fxLotError.InvalidOriginalQuantity({ originalQuantity });
  }
}

function validateRemainingQuantity(
  remainingQuantity: unknown
): asserts remainingQuantity is IMoney {
  if (
    !isValidMoney(remainingQuantity) ||
    !isNonNegativeMoney(remainingQuantity)
  ) {
    throw new fxLotError.InvalidRemainingQuantity({ remainingQuantity });
  }
}

function validateOriginalCostBasis(
  costBasis: unknown
): asserts costBasis is IMoney {
  if (!isValidMoney(costBasis) || !isPositiveMoney(costBasis)) {
    throw new fxLotError.InvalidCostBasis({ costBasis });
  }
}

function validateRemainingCostBasis(
  remainingCostBasis: unknown
): asserts remainingCostBasis is IMoney {
  if (
    !isValidMoney(remainingCostBasis) ||
    !isNonNegativeMoney(remainingCostBasis)
  ) {
    throw new fxLotError.InvalidRemainingCostBasis({ remainingCostBasis });
  }
}

function validateQuantity(
  originalQuantity: unknown,
  remainingQuantity: unknown
) {
  validateOriginalQuantity(originalQuantity);
  validateRemainingQuantity(remainingQuantity);

  if (!moneyValue.isSameCurrency(originalQuantity, remainingQuantity)) {
    throw new fxLotError.MismatchedQuantityCurrency({
      originalQuantity,
      remainingQuantity,
    });
  }

  if (moneyValue.isGreaterThan(remainingQuantity, originalQuantity)) {
    throw new fxLotError.ExcessRemainingQuantity({
      originalQuantity,
      remainingQuantity,
    });
  }
}

function validateCostBasis(costBasis: unknown, remainingCostBasis: unknown) {
  validateOriginalCostBasis(costBasis);
  validateRemainingCostBasis(remainingCostBasis);

  if (!moneyValue.isSameCurrency(costBasis, remainingCostBasis)) {
    throw new fxLotError.MismatchedCostBasisCurrency({
      costBasis,
      remainingCostBasis,
    });
  }

  if (moneyValue.isGreaterThan(remainingCostBasis, costBasis)) {
    throw new fxLotError.ExcessRemainingCostBasis({
      costBasis,
      remainingCostBasis,
    });
  }
}

const fxLotEntityHelpers = Object.freeze({
  isValidStatus,
  validateStatus,
  isValidMoney,
  validateQuantity,
  validateCostBasis,
});

export default fxLotEntityHelpers;
