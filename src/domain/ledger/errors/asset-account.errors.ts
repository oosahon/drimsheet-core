import { LedgerError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `ledger_error_asset_account_${string}`;

const EErrorKeys = {
  ControlAccountNotFound:
    'ledger_error_asset_account_control_account_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAssetAccountError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AssetAccountError extends LedgerError<UAssetAccountError> {
  constructor(key: UAssetAccountError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const assetAccountError = Object.freeze({
  Error: AssetAccountError,
  ...getMappedErrors(EErrorKeys, AssetAccountError),
});

export default assetAccountError;
