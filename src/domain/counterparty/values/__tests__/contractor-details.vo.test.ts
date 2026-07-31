import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import counterpartyError from '../../errors/counterparty.error';
import contractorDetailsValue from '../contractor-details.vo';

describe('contractorDetailsValue', () => {
  const counterPartyId = generateUUID();
  const validAddress: IAddress = {
    line1: '456 Tech Park',
    line2: null,
    city: 'Austin',
    region: 'TX',
    postalCode: '78701',
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
    it('should create valid IContractorDetails', () => {
      const details = contractorDetailsValue.make({
        counterPartyId,
        address: validAddress,
      });

      expect(details.counterPartyId).toBe(counterPartyId);
      expect(details.address).toEqual(validAddress);
      expect(details.createdAt).toEqual(new Date('2026-07-31T12:00:00.000Z'));
      expect(Object.isFrozen(details)).toBe(true);
    });

    it('should throw InvalidCounterpartyId for invalid counterPartyId', () => {
      expect(() =>
        contractorDetailsValue.make({
          counterPartyId: 'invalid-id' as TEntityId,
          address: validAddress,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });

    it('should throw InvalidAddress if address is missing', () => {
      expect(() =>
        contractorDetailsValue.make({
          counterPartyId,
          address: null as any,
        })
      ).toThrow(counterpartyError.InvalidAddress);
    });
  });
});
