import { TErrorCause } from '../../types/error.types';
import errorUtils from '../../utils/error';
import DomainError from '../errors/domain.error';

type TErrorKeyPrefix = `address_error_${string}`;

const EErrorKeys = {
  InvalidLine1: 'address_error_invalid_line1',
  InvalidCity: 'address_error_invalid_city',
  InvalidCountryCode: 'address_error_invalid_country_code',
  InvalidAddress: 'address_error_invalid_address',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAddressError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AddressError<
  K extends TErrorKeyPrefix = UAddressError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AddressError';
  }
}

const addressError = Object.freeze({
  Base: AddressError,
  ...errorUtils.getMappedErrors(EErrorKeys, AddressError),
});

export default addressError;
