import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { ICurrency } from '../../../currency/types/currency.types';
import userEntity from '../../../user/entities/user.entity';
import { IUser } from '../../../user/types/user.types';
import { EAccountingEntityEvents } from '../../events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
  UAccountingEntityType,
} from '../../types/accounting-entity.types';
import accountingEntityTypeEntity from '../accounting-entity.entity';

describe('Accounting Domain Entity', () => {
  let validUser: IUser;
  let validCurrency: ICurrency;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));

    const [user] = userEntity.make({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: false,
    });
    validUser = user;

    validCurrency = {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      minorUnit: 2n,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should successfully create an individual domain account with valid inputs', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      const [domain, events] = accountingEntityTypeEntity.make(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EAccountingEntityEvents.Created);
      expect(events[0].data).toEqual(domain);

      expect(typeof domain.id).toBe('string');
      expect(domain.id.length).toBeGreaterThan(0);
      expect(domain.name).toBe('Test Entity');
      expect(domain.operatingCountryCode).toBe('NG');
      expect(domain.ownerId).toEqual(validUser.id);
      expect(domain.functionalCurrency).toEqual(validCurrency);
      expect(domain.reportingCurrency).toEqual(validCurrency);
      expect(domain.fiscalYearStart).toEqual({ month: 12, day: 31 });
      expect(Object.isFrozen(domain.fiscalYearStart)).toBe(true);
      expect(domain.createdAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(domain.updatedAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(domain.deletedAt).toBeNull();
      expect(Object.isFrozen(domain)).toBe(true);
    });

    it('should successfully create an entity with a non-December fiscal year-end', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Company,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 3, day: 31 },
      };

      const [domain] = accountingEntityTypeEntity.make(payload);

      expect(domain.fiscalYearStart).toEqual({ month: 3, day: 31 });
    });

    it('should throw an AppError if the entity type is invalid', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: 'INVALID_TYPE' as UAccountingEntityType,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(
        'Invalid accounting entity type'
      );
    });

    it('should throw an AppError if the ownerId is invalid', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: 'invalid-uuid' as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if the functional currency code is invalid', () => {
      const invalidCurrency = { ...validCurrency, code: 'INVALID_CODE' };

      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: invalidCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if the reporting currency code is invalid', () => {
      const invalidCurrency = { ...validCurrency, code: 'INVALID_CODE' };

      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: invalidCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if currency code is undefined or not a string', () => {
      const invalidCurrency = {
        ...validCurrency,
        code: undefined as unknown as string,
      };

      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.SoleTrader,
        functionalCurrency: invalidCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if fiscal year-end month is out of range', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 13, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if fiscal year-end month is zero', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 0, day: 15 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if fiscal year-end day exceeds the maximum for the month', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 4, day: 31 }, // April has 30 days
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if fiscal year-end day is zero', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 6, day: 0 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should allow February 29 as a valid fiscal year-end day', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Company,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 2, day: 29 },
      };

      const [domain] = accountingEntityTypeEntity.make(payload);

      expect(domain.fiscalYearStart).toEqual({ month: 2, day: 29 });
    });

    it('should throw an AppError if February day exceeds 29', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Company,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 2, day: 30 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an AppError if name is invalid', () => {
      const payload1: TCreationOmits<IAccountingEntity> = {
        name: '   ',
        operatingCountryCode: 'NG',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };
      const payload2: TCreationOmits<IAccountingEntity> = {
        ...payload1,
        name: undefined as unknown as string,
      };

      expect(() => accountingEntityTypeEntity.make(payload1)).toThrow(
        'Invalid accounting entity name'
      );
      expect(() => accountingEntityTypeEntity.make(payload2)).toThrow(
        'Invalid accounting entity name'
      );
    });

    it('should throw an AppError if operatingCountryCode is unsupported', () => {
      const payload: TCreationOmits<IAccountingEntity> = {
        name: 'Test Entity',
        operatingCountryCode: 'INVALID_COUNTRY',
        ownerId: validUser.id as TEntityId,
        type: EAccountingEntityType.Individual,
        functionalCurrency: validCurrency,
        reportingCurrency: validCurrency,
        fiscalYearStart: { month: 12, day: 31 },
      };

      expect(() => accountingEntityTypeEntity.make(payload)).toThrow(
        'Invalid operating country code'
      );
    });
  });
});
