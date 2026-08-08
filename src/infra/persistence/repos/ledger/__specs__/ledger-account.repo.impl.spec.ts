import { EAssetSubType } from '../../../../../domain/ledger/types/asset-account.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../../../domain/ledger/types/ledger.types';
import { ERepoLock } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import getDbQuery from '../../../helpers/get-db-query';
import ledgerAccountRepo from '../ledger-account.repo.impl';
import ledgerAccountMapper from '../mappers/ledger-account.mapper';

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
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    const select = jest.fn().mockReturnValue({ from });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    (ledgerAccountMapper.toDomain as jest.Mock).mockReturnValue(account);

    await expect(
      ledgerAccountRepo.findByCode('100000', accountingEntityId, {
        correlationId: 'correlation-id',
        lock: lockMode,
      })
    ).resolves.toBe(account);

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
});
