import stringUtils from '../../../shared/utils/string';
import ledgerAccountError from '../errors/ledger-account.error';
import { ICreditCardAccountMeta } from '../types/liability-account.types';

function make(meta: ICreditCardAccountMeta) {
  const cardIssuer = stringUtils.sanitizeAndValidate(
    meta.cardIssuer,
    {
      min: 2,
      max: 100,
    },
    ledgerAccountError.InvalidCardIssuer
  );

  const lastFourDigits = stringUtils.sanitizeAndValidate(
    meta.lastFourDigits,
    {
      min: 4,
      max: 4,
    },
    ledgerAccountError.InvalidLastFourDigits
  );

  return Object.freeze<ICreditCardAccountMeta>({
    cardIssuer,
    lastFourDigits,
    lastReconciliationDate: null,
  });
}

const creditCardMetaValue = Object.freeze({
  make,
});

export default creditCardMetaValue;
