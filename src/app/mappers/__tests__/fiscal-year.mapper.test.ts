import { IFiscalYear } from '../../../domain/accounting/types/fiscal-year.types';
import { EPeriodStatus } from '../../../domain/accounting/types/period.types';
import { TEntityId } from '../../../shared/types/uuid';
import fiscalYearMapper from '../fiscal-year.mapper';

describe('fiscalYearMapper', () => {
  it('should map IFiscalYear to IFiscalYearRepoModel', () => {
    const domain: IFiscalYear = {
      id: 'uuid-1' as TEntityId,
      name: 'FY 2026',
      status: EPeriodStatus.Open,
      accountingEntityId: 'entity-1' as TEntityId,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      closedAt: null,
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const result = fiscalYearMapper.toRepo(domain);

    expect(result).toEqual({
      id: 'uuid-1',
      name: 'FY 2026',
      accountingEntityId: 'entity-1',
      unit: 'month',
      count: 12,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: EPeriodStatus.Open,
      closedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should map IFiscalYear to IFiscalYearRepoModel with closedAt', () => {
    const domain: IFiscalYear = {
      id: 'uuid-1' as TEntityId,
      name: 'FY 2026',
      status: EPeriodStatus.Closed,
      accountingEntityId: 'entity-1' as TEntityId,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      closedAt: new Date('2027-01-01T00:00:00Z'),
      updatedAt: new Date('2027-01-01T00:00:00Z'),
    };

    const result = fiscalYearMapper.toRepo(domain);

    expect(result.closedAt).toBe('2027-01-01T00:00:00.000Z');
  });
});
