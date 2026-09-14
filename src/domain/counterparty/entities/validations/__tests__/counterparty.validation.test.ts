import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import counterpartyValidation from '@domain/counterparty/entities/validations/counterparty.validation';
import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import {
  ECounterpartyRole,
  ECounterpartyStatus,
  ECounterpartyType,
  ICounterparty,
} from '@domain/counterparty/types/counterparty.types';

describe('counterpartyValidation', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(counterpartyValidation)).toBe(true);
    expect(counterpartyEntity.validateCounterparty).toBe(
      counterpartyValidation.validateCounterparty
    );
  });

  const validUUID = generateUUID();
  const validUUID2 = generateUUID();

  describe('validateAccountingEntityId', () => {
    it('should pass for a valid UUID', () => {
      expect(() =>
        counterpartyValidation.validateAccountingEntityId(validUUID)
      ).not.toThrow();
    });

    it('should throw InvalidAccountingEntityId error for invalid UUID', () => {
      expect(() =>
        counterpartyValidation.validateAccountingEntityId(
          'invalid-uuid' as TEntityId
        )
      ).toThrow(counterpartyError.InvalidAccountingEntityId);
    });
  });

  describe('validateName', () => {
    it('should sanitize and return valid name', () => {
      expect(counterpartyValidation.validateName('  Acme Corp  ')).toBe(
        'Acme Corp'
      );
    });

    it('should throw InvalidName error for empty name', () => {
      expect(() => counterpartyValidation.validateName('')).toThrow(
        counterpartyError.InvalidName
      );
    });
  });

  describe('validateType', () => {
    it('should pass for valid types', () => {
      expect(
        counterpartyValidation.validateType(ECounterpartyType.Individual)
      ).toBe(ECounterpartyType.Individual);
      expect(
        counterpartyValidation.validateType(ECounterpartyType.Organization)
      ).toBe(ECounterpartyType.Organization);
    });

    it('should throw InvalidType error for invalid type', () => {
      expect(() =>
        counterpartyValidation.validateType('invalid' as any)
      ).toThrow(counterpartyError.InvalidType);
    });
  });

  describe('validateStatus', () => {
    it('should pass for valid status', () => {
      expect(
        counterpartyValidation.validateStatus(ECounterpartyStatus.Active)
      ).toBe(ECounterpartyStatus.Active);
      expect(
        counterpartyValidation.validateStatus(ECounterpartyStatus.Archived)
      ).toBe(ECounterpartyStatus.Archived);
    });

    it('should throw InvalidStatus error for invalid status', () => {
      expect(() =>
        counterpartyValidation.validateStatus('invalid' as any)
      ).toThrow(counterpartyError.InvalidStatus);
    });
  });

  describe('validateRole', () => {
    it('should pass for valid role', () => {
      expect(
        counterpartyValidation.validateRole(ECounterpartyRole.Vendor)
      ).toBe(ECounterpartyRole.Vendor);
    });

    it('should throw InvalidRole error for invalid role', () => {
      expect(() =>
        counterpartyValidation.validateRole('invalid' as any)
      ).toThrow(counterpartyError.InvalidRole);
    });
  });

  describe('validateCounterparty', () => {
    it('should pass for a valid counterparty entity', () => {
      const validCounterparty: ICounterparty = {
        id: validUUID,
        accountingEntityId: validUUID2,
        name: 'Jane Doe',
        status: ECounterpartyStatus.Active,
        type: ECounterpartyType.Individual,
        roles: [ECounterpartyRole.Contractor],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() =>
        counterpartyValidation.validateCounterparty(validCounterparty)
      ).not.toThrow();
    });

    it('should throw InvalidCounterpartyEntity for null or non-object', () => {
      expect(() =>
        counterpartyValidation.validateCounterparty(null as any)
      ).toThrow(counterpartyError.InvalidCounterpartyEntity);
    });

    it('should throw InvalidRole if roles is not an array', () => {
      const invalidCounterparty: any = {
        id: validUUID,
        accountingEntityId: validUUID2,
        name: 'Jane Doe',
        status: ECounterpartyStatus.Active,
        type: ECounterpartyType.Individual,
        roles: 'not-an-array',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() =>
        counterpartyValidation.validateCounterparty(invalidCounterparty)
      ).toThrow(counterpartyError.InvalidRole);
    });
  });
});
