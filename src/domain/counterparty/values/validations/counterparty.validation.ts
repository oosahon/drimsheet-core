import stringUtils from '@shared/utils/string';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';

function sanitizeDisplayName(displayName?: string | null): string | null {
  if (
    displayName === undefined ||
    displayName === null ||
    !stringUtils.isNonEmptyString(displayName)
  ) {
    return null;
  }

  return stringUtils.sanitizeAndValidate(
    displayName,
    { min: 1, max: 255 },
    counterpartyError.InvalidName
  );
}

const counterpartyValidation = Object.freeze({
  sanitizeDisplayName,
});

export default counterpartyValidation;
