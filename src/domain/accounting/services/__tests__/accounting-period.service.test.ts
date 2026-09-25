import { TEntityId } from '@shared/types/uuid';

import periodError from '@domain/accounting/errors/period.error';
import IAccountingPeriodRepo from '@domain/accounting/repos/accounting-period.repo';
import makeAccountingPeriodService from '@domain/accounting/services/accounting-period.service';
import {
  EPeriodStatus,
  IAccountingPeriod,
} from '@domain/accounting/types/period.types';

const mockAccountingPeriodRepo: jest.Mocked<IAccountingPeriodRepo> = {
  findByDate: jest.fn(),
  create: jest.fn(),
};

describe('accountingPeriodService', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const postingDate = new Date('2026-03-31T00:00:00.000Z');
  const repoOptions = {
    correlationId: 'test-correlation-id',
  };
  const openPeriod = {
    createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    accountingEntityId,
    status: EPeriodStatus.Open,
  } as IAccountingPeriod;
  const service = makeAccountingPeriodService({
    accountingPeriodRepo: mockAccountingPeriodRepo,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the open period containing the posting date', async () => {
    mockAccountingPeriodRepo.findByDate.mockResolvedValue(openPeriod);

    await expect(
      service.validatePostingPeriod(
        accountingEntityId,
        postingDate,
        repoOptions
      )
    ).resolves.toBe(openPeriod);
    expect(mockAccountingPeriodRepo.findByDate).toHaveBeenCalledWith(
      accountingEntityId,
      postingDate,
      repoOptions
    );
  });

  it('rejects a posting date that is not covered by a period', async () => {
    mockAccountingPeriodRepo.findByDate.mockResolvedValue(null);

    await expect(
      service.validatePostingPeriod(
        accountingEntityId,
        postingDate,
        repoOptions
      )
    ).rejects.toBeInstanceOf(periodError.PostingDateNotCovered);
  });

  it.each([EPeriodStatus.Pending, EPeriodStatus.Closing, EPeriodStatus.Closed])(
    'rejects a %s posting period',
    async (status) => {
      mockAccountingPeriodRepo.findByDate.mockResolvedValue({
        ...openPeriod,
        status,
      });

      await expect(
        service.validatePostingPeriod(
          accountingEntityId,
          postingDate,
          repoOptions
        )
      ).rejects.toBeInstanceOf(periodError.PostingPeriodNotOpen);
    }
  );
});
