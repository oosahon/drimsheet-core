import {
  EPeriodStatus,
  EPeriodUnit,
  IAccountingPeriod,
} from '../../../../../../domain/accounting/types/period.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import accountingPeriodMapper from '../accounting-period.mapper';

describe('accountingPeriodMapper', () => {
  it('maps an accounting period to the repository model', () => {
    const domain: IAccountingPeriod = {
      id: 'uuid-1' as TEntityId,
      name: 'Jan 2026',
      accountingEntityId: 'entity-1' as TEntityId,
      fiscalYearId: 'fy-1' as TEntityId,
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      status: EPeriodStatus.Open,
      closedAt: null,
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    expect(accountingPeriodMapper.toRepo(domain)).toEqual({
      id: 'uuid-1',
      name: 'Jan 2026',
      accountingEntityId: 'entity-1',
      fiscalYearId: 'fy-1',
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: EPeriodStatus.Open,
      closedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('maps a closed accounting period to the repository model with closedAt', () => {
    const domain: IAccountingPeriod = {
      id: 'uuid-1' as TEntityId,
      name: 'Jan 2026',
      accountingEntityId: 'entity-1' as TEntityId,
      fiscalYearId: 'fy-1' as TEntityId,
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      status: EPeriodStatus.Closed,
      closedAt: new Date('2026-02-01T00:00:00Z'),
      updatedAt: new Date('2026-02-01T00:00:00Z'),
    };

    expect(accountingPeriodMapper.toRepo(domain).closedAt).toBe(
      '2026-02-01T00:00:00.000Z'
    );
  });

  it('maps a repository row to the immutable domain period', () => {
    const row = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Jan 2026',
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174002',
      fiscalYearId: '123e4567-e89b-12d3-a456-426614174003',
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: EPeriodStatus.Closed,
      closedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T01:00:00.000Z',
    };

    const result = accountingPeriodMapper.toDomain(row);

    expect(result).toEqual({
      id: row.id as TEntityId,
      name: row.name,
      accountingEntityId: row.accountingEntityId as TEntityId,
      fiscalYearId: row.fiscalYearId as TEntityId,
      unit: row.unit,
      count: row.count,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T00:00:00.000Z'),
      status: row.status,
      closedAt: new Date(row.closedAt),
      updatedAt: new Date(row.updatedAt),
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('maps a repository row with null closedAt to the immutable domain period', () => {
    const row = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Jan 2026',
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174002',
      fiscalYearId: '123e4567-e89b-12d3-a456-426614174003',
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: EPeriodStatus.Closed,
      closedAt: null,
      updatedAt: '2026-02-01T01:00:00.000Z',
    };

    const result = accountingPeriodMapper.toDomain(row);

    expect(result).toEqual({
      id: row.id as TEntityId,
      name: row.name,
      accountingEntityId: row.accountingEntityId as TEntityId,
      fiscalYearId: row.fiscalYearId as TEntityId,
      unit: row.unit,
      count: row.count,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T00:00:00.000Z'),
      status: row.status,
      closedAt: null,
      updatedAt: new Date(row.updatedAt),
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});
