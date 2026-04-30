import { IMoney } from '../../../../shared/types/money.types';
import moneyValue from '../../../../shared/value-objects/money.vo';
import {
  ELedgerAccountBalanceEffect,
  ULedgerAccountBalanceEffect,
} from '../../../bookkeeping/types/ledger-account-balance.types';
import ledgerAccountBalanceError from '../../errors/ledger-account-balance.errors';

function validateEffectType(effect: ULedgerAccountBalanceEffect) {
  if (!Object.values(ELedgerAccountBalanceEffect).includes(effect)) {
    throw new ledgerAccountBalanceError.InvalidBalanceEffect({ effect });
  }
}

function getEffectFromAmount(amount: IMoney): ULedgerAccountBalanceEffect {
  moneyValue.validate(amount);

  if (moneyValue.isZeroAmount(amount)) {
    return ELedgerAccountBalanceEffect.Noop;
  }

  const isPositiveDelta = moneyValue.isGreaterThan(
    amount,
    moneyValue.makeZeroAmount(amount.currency)
  );

  if (isPositiveDelta) {
    return ELedgerAccountBalanceEffect.Increase;
  } else {
    return ELedgerAccountBalanceEffect.Decrease;
  }
}

const ledgerAccountBalanceEntityHelpers = Object.freeze({
  validateEffectType,
  getEffectFromAmount,
});

export default ledgerAccountBalanceEntityHelpers;
