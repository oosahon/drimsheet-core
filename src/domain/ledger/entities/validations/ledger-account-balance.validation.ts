import ledgerAccountBalanceError from '@domain/ledger/errors/ledger-account-balance.error';
import {
  ELedgerAccountBalanceEffect,
  ULedgerAccountBalanceEffect,
} from '@domain/ledger/types/ledger-account-balance.types';

function validateEffectType(effect: ULedgerAccountBalanceEffect) {
  if (!Object.values(ELedgerAccountBalanceEffect).includes(effect)) {
    throw new ledgerAccountBalanceError.InvalidBalanceEffect({ effect });
  }
}

const ledgerAccountBalanceValidation = Object.freeze({
  validateEffectType,
});

export default ledgerAccountBalanceValidation;
