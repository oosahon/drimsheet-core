import {
  EPeriodStatus,
  EPeriodUnit,
  IAccountingPeriod,
} from '../../../../../domain/accounting/types/period.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import accountingPeriodMapper from '../accounting-period.mapper';

describe('accountingPeriodMapper', () => {
  it('should map IAccountingPeriod to IAccountingPeriodRepoModel', () => {
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

    const result = accountingPeriodMapper.toRepo(domain);

    expect(result).toEqual({
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

  it('should map closedAt', () => {
    const domain = {
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
    } as IAccountingPeriod;

    const result = accountingPeriodMapper.toRepo(domain);
    expect(result.closedAt).toBe('2026-02-01T00:00:00.000Z');
  });
});
