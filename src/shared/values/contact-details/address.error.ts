import { TErrorCause, TErrorKey, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorKeyPrefix = TErrorKey<'address_error'>;

const EErrorKeys = {
  InvalidLine1: 'address_error_line1_invalid',
  InvalidCity: 'address_error_city_invalid',
  InvalidCountryCode: 'address_error_country_code_invalid',
  InvalidAddress: 'address_error_address_invalid',
} as const satisfies TErrorKeys<'address_error'>;

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
