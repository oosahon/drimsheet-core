import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingPeriod } from '@domain/accounting/types/period.types';

import getDbQuery from '@infra/persistence/helpers/get-db-query';
import accountingPeriodRepo from '@infra/persistence/repos/accounting/accounting-period.repo.impl';
import accountingPeriodMapper from '@infra/persistence/repos/accounting/mappers/accounting-period.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/accounting-period.mapper');

describe('accountingPeriodRepoImpl', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const date = new Date('2026-01-31T23:59:59.999Z');
  const row = { id: 'period-row' };
  const period = { id: 'period-domain' } as IAccountingPeriod;

  function mockRead(results: unknown[]) {
    const baseQuery = {
      then: (resolve: (value: unknown[]) => void) => resolve(results),
    };
    const where = jest.fn().mockReturnValue(baseQuery);
    const from = jest.fn().mockReturnValue({ where });
    const select = jest.fn().mockReturnValue({ from });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    return { select, from, where };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (accountingPeriodMapper.toDomain as jest.Mock).mockReturnValue(period);
  });

  it.each([
    ['start boundary', new Date('2026-01-01T00:00:00.000Z')],
    ['end boundary', date],
  ])('finds and maps a period on its %s', async (_label, boundary) => {
    const query = mockRead([row]);

    await expect(
      accountingPeriodRepo.findByDate(accountingEntityId, boundary, {
        correlationId: 'correlation-id',
      })
    ).resolves.toBe(period);
    expect(query.where).toHaveBeenCalledTimes(1);
    expect(accountingPeriodMapper.toDomain).toHaveBeenCalledWith(row);
  });

  it('returns null when no period contains the date', async () => {
    mockRead([]);

    await expect(
      accountingPeriodRepo.findByDate(accountingEntityId, date, {
        correlationId: 'correlation-id',
      })
    ).resolves.toBeNull();
    expect(accountingPeriodMapper.toDomain).not.toHaveBeenCalled();
  });

  it('uses the supplied transaction', async () => {
    mockRead([row]);
    const tx = { transaction: jest.fn() } as ITransactionContext;
    const options = {
      correlationId: 'correlation-id',
      tx,
    };

    await accountingPeriodRepo.findByDate(accountingEntityId, date, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
  });
});
