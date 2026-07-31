import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import counterpartyError from '../../errors/counterparty.error';
import contractorEntity from '../contractor.entity';

describe('Contractor Entity', () => {
  const counterPartyId = generateUUID();
  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
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
    it('should create valid contractor', () => {
      const [contractor, events, audit] = contractorEntity.make({
        counterPartyId,
        address,
      });

      expect(contractor.counterPartyId).toBe(counterPartyId);
      expect(contractor.address).toEqual(address);
      expect(contractor.createdAt).toEqual(
        new Date('2026-07-31T12:00:00.000Z')
      );
      expect(Object.isFrozen(contractor)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:contractor:created');
      expect(events[0].data).toEqual(contractor);

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(contractor);
    });

    it('should throw error if address is missing', () => {
      expect(() =>
        contractorEntity.make({
          counterPartyId,
          address: null as any,
        })
      ).toThrow(counterpartyError.InvalidAddress);
    });
  });

  describe('update', () => {
    it('should update contractor and create correct audit diff', () => {
      const [beforeContractor] = contractorEntity.make({
        counterPartyId,
        address,
      });

      jest.setSystemTime(new Date('2026-07-31T13:00:00.000Z'));

      const newAddress: IAddress = {
        ...address,
        line1: '456 Market St',
      };

      const [afterContractor, events, audit] = contractorEntity.update(
        beforeContractor,
        {
          address: newAddress,
        }
      );

      expect(afterContractor.counterPartyId).toBe(counterPartyId);
      expect(afterContractor.address).toEqual(newAddress);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:contractor:updated');
      expect(events[0].data).toEqual(afterContractor);

      expect(audit.action).toBe('updated');
      expect(audit.diff.before).toEqual(beforeContractor);
      expect(audit.diff.after).toEqual(afterContractor);
    });
  });
});
