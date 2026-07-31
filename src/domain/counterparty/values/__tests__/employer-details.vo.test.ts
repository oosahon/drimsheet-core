import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import counterpartyError from '../../errors/counterparty.error';
import employerDetailsValue from '../employer-details.vo';

describe('employerDetailsValue', () => {
  const counterPartyId = generateUUID();
  const validAddress: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'Metropolis',
    region: 'NY',
    postalCode: '10001',
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
    it('should create valid IEmployerDetails', () => {
      const details = employerDetailsValue.make({
        counterPartyId,
        displayName: 'Acme Corp Inc',
        address: validAddress,
      });

      expect(details.counterPartyId).toBe(counterPartyId);
      expect(details.displayName).toBe('Acme Corp Inc');
      expect(details.address).toEqual(validAddress);
      expect(details.createdAt).toEqual(new Date('2026-07-31T12:00:00.000Z'));
      expect(Object.isFrozen(details)).toBe(true);
    });

    it('should throw InvalidCounterpartyId for invalid counterPartyId', () => {
      expect(() =>
        employerDetailsValue.make({
          counterPartyId: 'invalid-id' as TEntityId,
          address: validAddress,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });

    it('should throw InvalidAddress if address is missing', () => {
      expect(() =>
        employerDetailsValue.make({
          counterPartyId,
          address: null as any,
        })
      ).toThrow(counterpartyError.InvalidAddress);
    });
  });
});
