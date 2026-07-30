import stringUtils from '../../../../shared/utils/string';
import accountingEntityHelpers from '../../../accounting/entities/helpers/accounting-entity.entity.helpers';
import ledgerError from '../../shared/errors/ledger.error';
import { IBankDetails } from '../types/asset-account.types';

function make(payload: IBankDetails): Readonly<IBankDetails> {
  const countryCode = payload?.countryCode?.trim()?.toUpperCase() ?? '';

  if (
    !payload ||
    !accountingEntityHelpers.isValidJurisdictionCode(countryCode)
  ) {
    throw new ledgerError.InvalidValue({ countryCode: payload?.countryCode });
  }

  const bankName = stringUtils.sanitizeAndValidate(
    payload.bankName,
    { min: 2, max: 100 },
    ledgerError.InvalidValue
  );

  const accountName = stringUtils.sanitizeAndValidate(
    payload.accountName,
    { min: 2, max: 100 },
    ledgerError.InvalidValue
  );

  const accountNumber = stringUtils.sanitizeAndValidate(
    payload.accountNumber,
    { min: 6, max: 34 },
    ledgerError.InvalidValue
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
