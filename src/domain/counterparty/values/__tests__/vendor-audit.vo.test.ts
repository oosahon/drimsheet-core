import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import historyError from '../../../../shared/values/history/history.error';
import counterpartyError from '../../errors/counterparty.error';
import { EVendorHistoryAction } from '../../types/counterparty-audit.types';
import { IVendor } from '../../types/counterparty.types';
import vendorAuditValue from '../vendor-audit.vo';

describe('vendorAuditValue', () => {
  const counterPartyId = generateUUID();
  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    countryCode: 'US',
  };

  const mockDetails: IVendor = Object.freeze({
    counterPartyId,
    address,
    createdAt: new Date('2026-07-31T12:00:00.000Z'),
  });

  describe('make', () => {
    it('should create audit record for creation action', () => {
      const audit = vendorAuditValue.make({
        before: null,
        after: mockDetails,
        action: EVendorHistoryAction.Created,
      });

      expect(audit.entityId).toBe(counterPartyId);
      expect(audit.action).toBe(EVendorHistoryAction.Created);
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(mockDetails);
      expect(audit.occurredAt).toEqual(mockDetails.createdAt);
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('should throw InvalidDiff if before and after are identical', () => {
      expect(() =>
        vendorAuditValue.make({
          before: mockDetails,
          after: mockDetails,
          action: EVendorHistoryAction.Updated,
        })
      ).toThrow(historyError.InvalidDiff);
    });

    it('should throw InvalidCounterpartyId if after details has invalid counterparty id', () => {
      const invalidDetails: IVendor = Object.freeze({
        counterPartyId: 'invalid-id' as any,
        address,
        createdAt: mockDetails.createdAt,
      });

      expect(() =>
        vendorAuditValue.make({
          before: null,
          after: invalidDetails,
          action: EVendorHistoryAction.Created,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });
});
