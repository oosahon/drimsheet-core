import ledgerAccountBalanceError from '@domain/ledger/errors/ledger-account-balance.error';
import {
  ELedgerAccountBalanceEffect,
  ULedgerAccountBalanceEffect,
} from '@domain/ledger/types/ledger-account-balance.types';
import { IMoney } from '@domain/money/types/money.types';
import moneyValue from '@domain/money/values/money.vo';

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
