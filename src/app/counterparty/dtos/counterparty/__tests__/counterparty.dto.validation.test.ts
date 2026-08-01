import counterpartyError from '../../../../../domain/counterparty/errors/counterparty.error';
import paginationError from '../../../../../shared/values/pagination/pagination.error';
import {
  counterpartyCreateReqValidation,
  counterpartyStatusValidation,
  counterpartyTypeValidation,
  getCounterpartiesQueryValidationSchema,
} from '../counterparty.dto.validation';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidTypeKey = new counterpartyError.InvalidType().errorKey;
const invalidStatusKey = new counterpartyError.InvalidStatus().errorKey;

describe('Counterparty DTO validation', () => {
  const validPayload = {
    name: 'Acme Corp',
    status: 'active',
    type: 'organization',
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
  });

  describe('getCounterpartiesQueryValidationSchema', () => {
    it('accepts an empty query object', () => {
      const result = getCounterpartiesQueryValidationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('accepts and validates valid filters', () => {
      const validQuery = {
        roles: ['vendor', 'contractor'],
        type: 'organization',
        status: 'active',
        orderBy: 'name',
        sortDirection: 'asc',
        limit: 10,
        page: 2,
        search: 'Acme',
      };
      const result =
        getCounterpartiesQueryValidationSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validQuery);
      }
    });

    it('coerces single role string to an array', () => {
      const query = { roles: 'vendor' };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toEqual(['vendor']);
      }
    });

    it('coerces null role to undefined', () => {
      const query = { roles: null };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      if (!result.success)
        console.error(JSON.stringify(result.error.issues, null, 2));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toBeUndefined();
      }
    });

    it('coerces empty string role to undefined', () => {
      const query = { roles: '' };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toBeUndefined();
      }
    });

    it('rejects invalid role inside the roles array', () => {
      const invalidRoleKey = new counterpartyError.InvalidRole().errorKey;
      const query = { roles: ['vendor', 'invalid_role'] };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidRoleKey);
      }
    });

    it('rejects invalid type', () => {
      const query = { type: 'invalid_type' };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidTypeKey);
      }
    });

    it('rejects invalid status', () => {
      const query = { status: 'invalid_status' };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidStatusKey);
      }
    });

    it('rejects invalid orderBy', () => {
      const invalidOrderByKey = new paginationError.InvalidOrderBy().errorKey;
      const query = { orderBy: 'invalid_order_by' };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidOrderByKey);
      }
    });

    it('rejects invalid pagination limit', () => {
      const invalidLimitKey = new paginationError.InvalidLimit().errorKey;
      const query = { limit: -1 };
      const result = getCounterpartiesQueryValidationSchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidLimitKey);
      }
    });
  });
});
