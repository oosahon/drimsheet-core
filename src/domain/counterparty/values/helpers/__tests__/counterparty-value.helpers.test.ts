import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';
import { IAddress } from '@shared/values/contact-details/types/address.types';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import counterpartyValueHelpers from '@domain/counterparty/values/helpers/counterparty-value.helpers';

describe('counterpartyValueHelpers', () => {
  const validCounterpartyId = generateUUID();
  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    countryCode: 'US',
  };

  describe('validateCounterpartyId', () => {
    it('passes for a valid UUID', () => {
      expect(() =>
        counterpartyValueHelpers.validateCounterpartyId(validCounterpartyId)
      ).not.toThrow();
    });

    it('throws InvalidCounterpartyId for an invalid UUID', () => {
      expect(() =>
        counterpartyValueHelpers.validateCounterpartyId(
          'invalid-id' as TEntityId
        )
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });

  describe('validateAddress', () => {
    it('returns a valid address', () => {
      expect(counterpartyValueHelpers.validateAddress(address, true)).toBe(
        address
      );
    });

    it.each([null, undefined])(
      'returns null for optional missing address %p',
      (missingAddress) => {
        expect(
          counterpartyValueHelpers.validateAddress(missingAddress, false)
        ).toBeNull();
      }
    );

    it.each([null, undefined])(
      'throws InvalidAddress for required missing address %p',
      (missingAddress) => {
        expect(() =>
          counterpartyValueHelpers.validateAddress(missingAddress, true)
        ).toThrow(counterpartyError.InvalidAddress);
      }
    );
  });

  describe('sanitizeDisplayName', () => {
    it('sanitizes and returns a non-empty display name', () => {
      expect(
        counterpartyValueHelpers.sanitizeDisplayName('  Acme Corp  ')
      ).toBe('Acme Corp');
    });

    it.each([undefined, null, '', '   '])(
      'returns null for empty display name %p',
      (displayName) => {
        expect(
          counterpartyValueHelpers.sanitizeDisplayName(displayName)
        ).toBeNull();
      }
    );

    it('throws InvalidName for a display name that is too long', () => {
      const displayName = 'a'.repeat(256);

      expect(() =>
        counterpartyValueHelpers.sanitizeDisplayName(displayName)
      ).toThrow(counterpartyError.InvalidName);
    });
  });
});
