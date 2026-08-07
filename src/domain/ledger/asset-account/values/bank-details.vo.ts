import stringUtils from '../../../../shared/utils/string';
import accountingEntityHelpers from '../../../accounting/entities/helpers/accounting-entity.entity.helpers';
import ledgerAccountError from '../../errors/ledger-account.error';
import { IBankDetails } from '../types/asset-account.types';

function make(payload: IBankDetails): Readonly<IBankDetails> {
  const countryCode = payload?.countryCode?.trim()?.toUpperCase() ?? '';

  if (
    !payload ||
    !accountingEntityHelpers.isValidJurisdictionCode(countryCode)
  ) {
    throw new ledgerAccountError.InvalidCountryCode({
      countryCode: payload?.countryCode,
    });
  }

  const bankName = stringUtils.sanitizeAndValidate(
    payload.bankName,
    { min: 2, max: 100 },
    ledgerAccountError.InvalidBankName
  );

  const accountName = stringUtils.sanitizeAndValidate(
    payload.accountName,
    { min: 2, max: 100 },
    ledgerAccountError.InvalidBankAccountName
  );

  const accountNumber = stringUtils.sanitizeAndValidate(
    payload.accountNumber,
    { min: 6, max: 34 },
    ledgerAccountError.InvalidBankAccountNumber
  );

  return Object.freeze({
    countryCode,
    bankName,
    accountName,
    accountNumber,
  });
}

const bankDetailsValue = Object.freeze({
  make,
});

export default bankDetailsValue;
