import getEntitiesAndEvents from '@shared/helpers/get-entities-and-events';
import { TEntityId } from '@shared/types/uuid';

import accountingPeriodEntity from '@domain/accounting/entities/accounting-period.entity';
import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { EPeriodActions } from '@domain/accounting/types/period-audit.types';
import {
  EPeriodStatus,
  EPeriodUnit,
} from '@domain/accounting/types/period.types';

describe('accountingPeriodEntity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    const validFiscalYear: IFiscalYear = {
      id: '12302eb7-ec79-436f-b258-00a4fb9a5123' as TEntityId,
      name: 'FY 2026',
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      status: EPeriodStatus.Pending,
      closedAt: null,
      updatedAt: new Date(),
    };

    const validPayload = {
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      unit: EPeriodUnit.Quarter,
      count: 4,
      fiscalYear: validFiscalYear,
    };

    it('creates an array of valid accounting period entities', () => {
      const result = accountingPeriodEntity.make(validPayload);
      const { entities, events } = getEntitiesAndEvents(result);

      // A 12 month fiscal year split into 1-quarter periods = 4 periods
      expect(entities.length).toBe(4);

      const firstEntity = entities[0];
      expect(firstEntity.name).toBe('Accounting Period 1');
      expect(firstEntity.accountingEntityId).toBe(
        validPayload.accountingEntityId
      );
      expect(firstEntity.fiscalYearId).toBe(validPayload.fiscalYear.id);
      expect(firstEntity.unit).toBe(validPayload.unit);
      expect(firstEntity.count).toBe(validPayload.count);
      expect(firstEntity.startDate).toEqual(
        new Date('2026-01-01T00:00:00.000Z')
      );
      expect(firstEntity.status).toBe(EPeriodStatus.Open);
      expect(firstEntity.closedAt).toBeNull();
      expect(firstEntity.updatedAt).toEqual(
        new Date('2026-04-01T00:00:00.000Z')
      );
      expect(firstEntity.id).toBeDefined();

      expect(Object.isFrozen(firstEntity)).toBe(true);

      // It returns one accountingPeriodCreated event for each period
      expect(events.length).toBe(4);
      expect(events[0].type).toBe(
        'domain:accounting:period:accounting-period:created'
      );

      const firstAudit = result[0][2];
      expect(firstAudit).toEqual({
        entityId: firstEntity.id,
        entityVersion: 1,
        action: EPeriodActions.Created,
        diff: {
          before: null,
          after: firstEntity,
        },
        occurredAt: firstEntity.updatedAt,
      });
      expect(Object.isFrozen(firstAudit)).toBe(true);
    });

    it('throws InvalidPeriodUnitError if unit is invalid', () => {
      const invalidPayload = { ...validPayload, unit: 'invalid' };
      // @ts-expect-error testing invalid unit
      expect(() => accountingPeriodEntity.make(invalidPayload)).toThrow();
    });

    it('throws InvalidPeriodIntervalError if count is invalid', () => {
      const invalidPayload = { ...validPayload, count: -1 };
      expect(() => accountingPeriodEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if count is not a numeric value', () => {
      const invalidPayload = {
        ...validPayload,
        count: 'invalid',
      };
      // @ts-expect-error testing invalid count
      expect(() => accountingPeriodEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid' as TEntityId,
      };
      expect(() => accountingPeriodEntity.make(invalidPayload)).toThrow();
    });
  });
});
