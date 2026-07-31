import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAddress } from '../../../../shared/values/contact-details/types/address.types';
import historyError from '../../../../shared/values/history/history.error';
import counterpartyError from '../../errors/counterparty.error';
import { EEmployerHistoryAction } from '../../types/counterparty-audit.types';
import { IEmployer } from '../../types/counterparty.types';
import employerAuditValue from '../employer-audit.vo';

describe('employerAuditValue', () => {
  const counterPartyId = generateUUID();
  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    countryCode: 'US',
  };

  const mockDetails: IEmployer = Object.freeze({
    counterPartyId,
    displayName: 'MegaCorp',
    address,
    createdAt: new Date('2026-07-31T12:00:00.000Z'),
  });

  describe('make', () => {
    it('should create audit record for creation action', () => {
      const audit = employerAuditValue.make({
        before: null,
        after: mockDetails,
        action: EEmployerHistoryAction.Created,
      });

      expect(audit.entityId).toBe(counterPartyId);
      expect(audit.action).toBe(EEmployerHistoryAction.Created);
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(mockDetails);
      expect(audit.occurredAt).toEqual(mockDetails.createdAt);
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('should throw InvalidDiff if before and after are identical', () => {
      expect(() =>
        employerAuditValue.make({
          before: mockDetails,
          after: mockDetails,
          action: EEmployerHistoryAction.Updated,
        })
      ).toThrow(historyError.InvalidDiff);
    });

    it('should throw InvalidCounterpartyId if after details has invalid counterparty id', () => {
      const invalidDetails: IEmployer = Object.freeze({
        counterPartyId: 'invalid-id' as any,
        displayName: 'MegaCorp',
        address,
        createdAt: mockDetails.createdAt,
      });

      expect(() =>
        employerAuditValue.make({
          before: null,
          after: invalidDetails,
          action: EEmployerHistoryAction.Created,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });
});
