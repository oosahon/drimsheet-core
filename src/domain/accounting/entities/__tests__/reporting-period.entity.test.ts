import { TEntityId } from '../../../../shared/types/uuid';
import { EPeriodEvents } from '../../events/period.events';
import { EPeriodActions } from '../../types/period-audit.types';
import { EPeriodStatus, EPeriodUnit } from '../../types/period.types';
import fiscalYearEntity from '../fiscal-year.entity';
import reportingPeriodEntity from '../reporting-period.entity';

describe('reportingPeriodEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  const accountingEntityId =
    '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    const makePayload = () => {
      const [fiscalYear] = fiscalYearEntity.make({
        accountingEntityId,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T23:59:59.999Z'),
        status: EPeriodStatus.Open,
      });

      return {
        accountingEntityId,
        unit: EPeriodUnit.Quarter,
        count: 4,
        fiscalYear,
      };
    };

    it('creates audited reporting periods with events', () => {
      const result = reportingPeriodEntity.make(makePayload());

      expect(result).toHaveLength(4);

      const [entity, events, audit] = result[0];
      expect(entity).toMatchObject({
        name: 'Reporting Period 1',
        accountingEntityId,
        unit: EPeriodUnit.Quarter,
        count: 4,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        fiscalYearId: expect.any(String),
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
      });
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: EPeriodEvents.ReportingPeriodCreated,
        data: entity,
      });

      expect(audit).toEqual({
        entityId: entity.id,
        action: EPeriodActions.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('throws if the accounting entity ID is invalid', () => {
      const payload = {
        ...makePayload(),
        accountingEntityId: 'invalid-id' as TEntityId,
      };

      expect(() => reportingPeriodEntity.make(payload)).toThrow();
    });

    it('throws if the period unit is invalid', () => {
      const payload = {
        ...makePayload(),
        unit: 'invalid-unit',
      };

      // @ts-expect-error testing invalid period unit
      expect(() => reportingPeriodEntity.make(payload)).toThrow();
    });

    it('throws if the period count is invalid', () => {
      const payload = {
        ...makePayload(),
        count: 0,
      };

      expect(() => reportingPeriodEntity.make(payload)).toThrow();
    });
  });
});
