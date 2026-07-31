import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import counterpartyError from '../../errors/counterparty.error';
import employerEntity from '../employer.entity';

describe('Employer Entity', () => {
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
    it('should create valid employer with address and display name', () => {
      const [employer, events, audit] = employerEntity.make({
        counterPartyId,
        displayName: '  MegaCorp Inc  ',
        address,
      });

      expect(employer.counterPartyId).toBe(counterPartyId);
      expect(employer.displayName).toBe('MegaCorp Inc');
      expect(employer.address).toEqual(address);
      expect(employer.createdAt).toEqual(new Date('2026-07-31T12:00:00.000Z'));
      expect(Object.isFrozen(employer)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:employer:created');
      expect(events[0].data).toEqual(employer);

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(employer);
    });

    it('should throw error if address is missing', () => {
      expect(() =>
        employerEntity.make({
          counterPartyId,
          displayName: 'MegaCorp Inc',
          address: null as any,
        })
      ).toThrow(counterpartyError.InvalidAddress);
    });
  });

  describe('update', () => {
    it('should update employer and create correct audit diff', () => {
      const [beforeEmployer] = employerEntity.make({
        counterPartyId,
        displayName: 'MegaCorp',
        address,
      });

      jest.setSystemTime(new Date('2026-07-31T13:00:00.000Z'));

      const newAddress: IAddress = {
        ...address,
        line1: '456 Market St',
      };

      const [afterEmployer, events, audit] = employerEntity.update(
        beforeEmployer,
        {
          displayName: 'MegaCorp Updated',
          address: newAddress,
        }
      );

      expect(afterEmployer.counterPartyId).toBe(counterPartyId);
      expect(afterEmployer.displayName).toBe('MegaCorp Updated');
      expect(afterEmployer.address).toEqual(newAddress);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:employer:updated');
      expect(events[0].data).toEqual(afterEmployer);

      expect(audit.action).toBe('updated');
      expect(audit.diff.before).toEqual(beforeEmployer);
      expect(audit.diff.after).toEqual(afterEmployer);
    });
  });
});
