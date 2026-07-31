import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import counterpartyError from '../../errors/counterparty.error';
import vendorDetailsValue from '../vendor-details.vo';

describe('vendorDetailsValue', () => {
  const counterPartyId = generateUUID();
  const validAddress: IAddress = {
    line1: '789 Commerce Way',
    line2: null,
    city: 'Chicago',
    region: 'IL',
    postalCode: '60601',
    countryCode: 'US',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-31T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    it('should create valid IVendorDetails with address', () => {
      const details = vendorDetailsValue.make({
        counterPartyId,
        address: validAddress,
      });

      expect(details.counterPartyId).toBe(counterPartyId);
      expect(details.address).toEqual(validAddress);
      expect(details.createdAt).toEqual(new Date('2026-07-31T12:00:00.000Z'));
      expect(Object.isFrozen(details)).toBe(true);
    });

    it('should create valid IVendorDetails without address (address is optional for vendor)', () => {
      const details = vendorDetailsValue.make({
        counterPartyId,
      });

      expect(details.counterPartyId).toBe(counterPartyId);
      expect(details.address).toBeNull();
    });

    it('should throw InvalidCounterpartyId for invalid counterPartyId', () => {
      expect(() =>
        vendorDetailsValue.make({
          counterPartyId: 'invalid-id' as TEntityId,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });
});
