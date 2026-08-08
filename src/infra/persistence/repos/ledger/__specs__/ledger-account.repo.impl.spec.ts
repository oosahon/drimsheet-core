import { ERepoLock } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { EAssetSubType } from '@domain/ledger/types/asset-account.types';
import { ELedgerType, ILedgerAccount } from '@domain/ledger/types/ledger.types';

import getDbQuery from '@infra/persistence/helpers/get-db-query';
import ledgerAccountRepo from '@infra/persistence/repos/ledger/ledger-account.repo.impl';
import ledgerAccountMapper from '@infra/persistence/repos/ledger/mappers/ledger-account.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/ledger-account.mapper');

describe('ledgerAccountRepoImpl allocation reads', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeAwaitable(results: unknown[]) {
    const lock = jest.fn().mockResolvedValue(results);
    return {
      query: {
        for: lock,
        then: (resolve: (value: unknown[]) => void) => resolve(results),
      },
      lock,
    };
  }

  it.each([
    ['unlocked', undefined],
    ['update locked', ERepoLock.Update],
  ])('findByCode supports an %s allocation read', async (_label, lockMode) => {
    const row = { id: 'account-row' };
    const account = { id: 'account-domain' } as ILedgerAccount;
    const awaitable = makeAwaitable([row]);
    const where = jest.fn().mockReturnValue(awaitable.query);
    const leftJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ leftJoin });
    const select = jest.fn().mockReturnValue({ from });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    (ledgerAccountMapper.toDomain as jest.Mock).mockReturnValue(account);

    await expect(
      ledgerAccountRepo.findByCode('100000', accountingEntityId, {
        correlationId: 'correlation-id',
        lock: lockMode,
      })
    ).resolves.toBe(account);

    expect(leftJoin).toHaveBeenCalled();

    if (lockMode) {
      expect(awaitable.lock).toHaveBeenCalledWith(lockMode);
    } else {
      expect(awaitable.lock).not.toHaveBeenCalled();
    }
  });

  it.each([
    ['unlocked', undefined],
    ['update locked', ERepoLock.Update],
  ])(
    'findLatestBySubType supports an %s allocation read',
    async (_label, lockMode) => {
      const latest = {
        id: 'latest-id',
        code: '100001',
        materializedPath: '100000.100001',
      };
      const awaitable = makeAwaitable([latest]);
      const limit = jest.fn().mockReturnValue(awaitable.query);
      const orderBy = jest.fn().mockReturnValue({ limit });
      const where = jest.fn().mockReturnValue({ orderBy });
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });
      (getDbQuery as jest.Mock).mockReturnValue({ select });

      await expect(
        ledgerAccountRepo.findLatestBySubType(
          accountingEntityId,
          ELedgerType.Asset,
          EAssetSubType.CashAndCashEquivalent,
          { correlationId: 'correlation-id', lock: lockMode }
        )
      ).resolves.toEqual(latest);

      if (lockMode) {
        expect(awaitable.lock).toHaveBeenCalledWith(lockMode);
      } else {
        expect(awaitable.lock).not.toHaveBeenCalled();
      }
    }
  );

  it.each([
    [
      'findById',
      () =>
        ledgerAccountRepo.findById(
          'account-id' as TEntityId,
          accountingEntityId,
          {
            correlationId: 'correlation-id',
          }
        ),
    ],
    [
      'findAllByIds',
      () =>
        ledgerAccountRepo.findAllByIds(['account-id' as TEntityId], {
          correlationId: 'correlation-id',
        }),
    ],
    [
      'findBySubType',
      () =>
        ledgerAccountRepo.findBySubType(
          accountingEntityId,
          ELedgerType.Asset,
          EAssetSubType.CashAndCashEquivalent,
          { correlationId: 'correlation-id' }
        ),
    ],
    [
      'findByBehavior',
      () =>
        ledgerAccountRepo.findByBehavior(accountingEntityId, 'POSTING', {
          correlationId: 'correlation-id',
        }),
    ],
  ])('%s retains a row without a currency relation', async (_name, read) => {
    const row = { id: 'account-row', currency: null };
    const account = { id: 'account-domain', currency: null } as ILedgerAccount;
    const where = jest.fn().mockResolvedValue([row]);
    const leftJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ leftJoin });
    const select = jest.fn().mockReturnValue({ from });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    (ledgerAccountMapper.toDomain as jest.Mock).mockReturnValue(account);

    const result = await read();

    expect(leftJoin).toHaveBeenCalled();
    expect(ledgerAccountMapper.toDomain).toHaveBeenCalledWith(row, 0, [row]);
    expect(result).toEqual(_name === 'findById' ? account : [account]);
  });

  it('findAll retains a paginated row without a currency relation', async () => {
    const row = { id: 'account-row', currency: null };
    const account = { id: 'account-domain', currency: null } as ILedgerAccount;
    const countWhere = jest.fn().mockResolvedValue([{ count: 1 }]);
    const countFrom = jest.fn().mockReturnValue({ where: countWhere });
    const offset = jest.fn().mockResolvedValue([row]);
    const limit = jest.fn().mockReturnValue({ offset });
    const orderBy = jest.fn().mockReturnValue({ limit });
    const dataWhere = jest.fn().mockReturnValue({ orderBy });
    const leftJoin = jest.fn().mockReturnValue({ where: dataWhere });
    const dataFrom = jest.fn().mockReturnValue({ leftJoin });
    const select = jest
      .fn()
      .mockReturnValueOnce({ from: countFrom })
      .mockReturnValueOnce({ from: dataFrom });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    (ledgerAccountMapper.toDomain as jest.Mock).mockReturnValue(account);

    const result = await ledgerAccountRepo.findAll(accountingEntityId, {
      correlationId: 'correlation-id',
    });

    expect(leftJoin).toHaveBeenCalled();
    expect(result.data).toEqual([account]);
  });
});
