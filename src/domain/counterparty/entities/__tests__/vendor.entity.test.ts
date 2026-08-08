import generateUUID from '@shared/utils/uuid-generator';
import { IAddress } from '@shared/values/contact-details/types/address.types';

import vendorEntity from '@domain/counterparty/entities/vendor.entity';

describe('Vendor Entity', () => {
  const counterpartyId = generateUUID();
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
    it('should create a valid vendor with address', () => {
      const [vendor, events, audit] = vendorEntity.make({
        counterpartyId,
        address,
      });

      expect(vendor.counterpartyId).toBe(counterpartyId);
      expect(vendor.address).toEqual(address);
      expect(vendor.createdAt).toEqual(new Date('2026-07-31T12:00:00.000Z'));
      expect(Object.isFrozen(vendor)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:vendor:created');
      expect(events[0].data).toEqual(vendor);

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(vendor);
    });

    it('should create a valid vendor without address', () => {
      const [vendor, events, audit] = vendorEntity.make({
        counterpartyId,
        address: null,
      });

      expect(vendor.counterpartyId).toBe(counterpartyId);
      expect(vendor.address).toBeNull();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:vendor:created');
      expect(audit.action).toBe('created');
    });
  });

  describe('update', () => {
    it('should update vendor and create correct audit diff', () => {
      const [beforeVendor] = vendorEntity.make({
        counterpartyId,
        address,
      });

      jest.setSystemTime(new Date('2026-07-31T13:00:00.000Z'));

      const newAddress: IAddress = {
        ...address,
        line1: '456 Market St',
      };

      const [afterVendor, events, audit] = vendorEntity.update(beforeVendor, {
        address: newAddress,
      });

      expect(afterVendor.counterpartyId).toBe(counterpartyId);
      expect(afterVendor.address).toEqual(newAddress);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:vendor:updated');
      expect(events[0].data).toEqual(afterVendor);

      expect(audit.action).toBe('updated');
      expect(audit.diff.before).toEqual(beforeVendor);
      expect(audit.diff.after).toEqual(afterVendor);
    });
  });
});
