import counterpartyError from '../../../../../domain/counterparty/errors/counterparty.error';
import {
  counterpartyCreateReqValidation,
  counterpartyStatusValidation,
  counterpartyTypeValidation,
} from '../counterparty.dto.validation';

const invalidAccountingEntityIdKey =
  new counterpartyError.InvalidAccountingEntityId().errorKey;
const invalidCounterpartyIdKey = new counterpartyError.InvalidCounterpartyId()
  .errorKey;
const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidTypeKey = new counterpartyError.InvalidType().errorKey;
const invalidStatusKey = new counterpartyError.InvalidStatus().errorKey;

describe('Counterparty DTO validation', () => {
  const validPayload = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Acme Corp',
    status: 'active',
    type: 'organization',
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };

  describe('counterpartyStatusValidation', () => {
    it('accepts valid statuses', () => {
      expect(counterpartyStatusValidation.safeParse('active').success).toBe(
        true
      );
      expect(counterpartyStatusValidation.safeParse('archived').success).toBe(
        true
      );
    });

    it('rejects invalid statuses', () => {
      const result = counterpartyStatusValidation.safeParse('invalid_status');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidStatusKey);
      }
    });
  });

  describe('counterpartyTypeValidation', () => {
    it('accepts valid types', () => {
      expect(counterpartyTypeValidation.safeParse('individual').success).toBe(
        true
      );
      expect(counterpartyTypeValidation.safeParse('organization').success).toBe(
        true
      );
    });

    it('rejects invalid types', () => {
      const result = counterpartyTypeValidation.safeParse('invalid_type');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidTypeKey);
      }
    });
  });

  describe('counterpartyCreateReqValidation', () => {
    it('accepts a valid payload', () => {
      const result = counterpartyCreateReqValidation.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (!result.success) {
        throw result.error;
      }
      expect(result.data).toEqual(validPayload);
    });

    it('trims name whitespace', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        name: '  Acme Corp  ',
      });
      expect(result.success).toBe(true);
      if (!result.success) {
        throw result.error;
      }
      expect(result.data.name).toBe('Acme Corp');
    });

    it('rejects invalid counterparty id', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidCounterpartyIdKey);
      }
    });

    it('rejects empty or whitespace-only name', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        name: '   ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidNameKey);
      }
    });

    it('rejects name exceeding 255 characters', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        name: 'a'.repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidNameKey);
      }
    });

    it('rejects invalid Date for createdAt', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        createdAt: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid Date for updatedAt', () => {
      const result = counterpartyCreateReqValidation.safeParse({
        ...validPayload,
        updatedAt: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });
  });
});
