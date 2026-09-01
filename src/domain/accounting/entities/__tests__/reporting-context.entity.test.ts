import { TEntityId } from '@shared/types/uuid';

import reportingContextEntity from '@domain/accounting/entities/reporting-context.entity';
import { EReportingContextEvents } from '@domain/accounting/events/reporting-context.events';
import { EReportingContextActions } from '@domain/accounting/types/reporting-context-audit.types';

describe('reportingContextEntity', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const validPayload = {
    name: 'USD Reporting Context',
    description: 'Weekly automated translation reports',
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    reportingCurrencyCode: 'NGN',
    accountingContextId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    currentReportingPeriodId:
      '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    accountingStandardCode: 'IFRS',
  } as const;

  describe('make', () => {
    it('creates a valid reporting context entity with events', () => {
      const [entity, events, audit] = reportingContextEntity.make(validPayload);

      expect(entity).toEqual({
        id: expect.any(String),
        name: validPayload.name,
        description: validPayload.description,
        accountingEntityId: validPayload.accountingEntityId,
        reportingCurrencyCode: validPayload.reportingCurrencyCode,
        accountingContextId: validPayload.accountingContextId,
        currentReportingPeriodId: validPayload.currentReportingPeriodId,
        accountingStandardCode: validPayload.accountingStandardCode,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        closedAt: null,
      });
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: EReportingContextEvents.Created,
        data: entity,
      });

      expect(audit).toEqual({
        entityId: entity.id,
        entityVersion: 1,
        action: EReportingContextActions.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if reportingCurrencyCode is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        reportingCurrencyCode: 'INVALID',
      };
      // @ts-expect-error testing invalid currency code
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if accountingContextId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingContextId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if currentReportingPeriodId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        currentReportingPeriodId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if name is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        name: '',
      };
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });

    it('throws AppError if description is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        description: '',
      };
      expect(() => reportingContextEntity.make(invalidPayload)).toThrow();
    });
  });
});
