import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import historyError from '../../../../shared/values/history/history.error';
import counterpartyError from '../../errors/counterparty.error';
import { EContractorHistoryAction } from '../../types/counterparty-audit.types';
import { IContractor } from '../../types/counterparty.types';
import contractorAuditValue from '../contractor-audit.vo';

describe('contractorAuditValue', () => {
  const counterPartyId = generateUUID();
  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    countryCode: 'US',
  };

  const mockDetails: IContractor = Object.freeze({
    counterPartyId,
    address,
    createdAt: new Date('2026-07-31T12:00:00.000Z'),
  });

  describe('make', () => {
    it('should create audit record for creation action', () => {
      const audit = contractorAuditValue.make({
        before: null,
        after: mockDetails,
        action: EContractorHistoryAction.Created,
      });

      expect(audit.entityId).toBe(counterPartyId);
      expect(audit.action).toBe(EContractorHistoryAction.Created);
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(mockDetails);
      expect(audit.occurredAt).toEqual(mockDetails.createdAt);
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('should throw InvalidDiff if before and after are identical', () => {
      expect(() =>
        contractorAuditValue.make({
          before: mockDetails,
          after: mockDetails,
          action: EContractorHistoryAction.Updated,
        })
      ).toThrow(historyError.InvalidDiff);
    });

    it('should throw InvalidCounterpartyId if after details has invalid counterparty id', () => {
      const invalidDetails: IContractor = Object.freeze({
        counterPartyId: 'invalid-id' as any,
        address,
        createdAt: mockDetails.createdAt,
      });

      expect(() =>
        contractorAuditValue.make({
          before: null,
          after: invalidDetails,
          action: EContractorHistoryAction.Created,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });
});
