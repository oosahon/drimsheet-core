import { eq } from 'drizzle-orm';

import generateUUID from '@shared/utils/uuid-generator';
import repoError from '@shared/values/errors/repo.error';

import { IUser } from '@domain/user/types/user.types';

import { usersInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userMapper from '@infra/persistence/repos/user/mappers/user.mapper';
import userHistoryRepo from '@infra/persistence/repos/user/user-history.repo.impl';
import userRepo from '@infra/persistence/repos/user/user.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/user.mapper');
jest.mock('../user-history.repo.impl');
jest.mock('drizzle-orm', () => {
  const drizzle =
    jest.requireActual<typeof import('drizzle-orm')>('drizzle-orm');

  return { ...drizzle, eq: jest.fn(drizzle.eq) };
});

describe('userRepo strict updates', () => {
  const user = { id: generateUUID(), version: 2 } as IUser;
  const history = { entityId: user.id, entityVersion: 2 } as never;
  const repoModel = { id: user.id, version: user.version } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(userMapper.toRepo).mockReturnValue(repoModel);
  });

  function mockUpdate(rowCount: number) {
    const where = jest.fn().mockResolvedValue({ rowCount });
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const tx = { update };
    jest.mocked(getDbQuery).mockReturnValue({
      transaction: jest.fn(async (callback) => callback(tx as never)),
    } as unknown as ReturnType<typeof getDbQuery>);

    return { set, where };
  }

  it('persists the entity version and predicates the update on expectedVersion', async () => {
    const query = mockUpdate(1);

    await userRepo.update(user, {
      correlationId: 'correlation-id',
      expectedVersion: 1,
      history,
    });

    expect(query.set).toHaveBeenCalledWith(repoModel);
    expect(eq).toHaveBeenCalledWith(usersInCore.version, 1);
    expect(userHistoryRepo.save).toHaveBeenCalledWith(
      history,
      expect.objectContaining({ tx: expect.anything() })
    );
  });

  it('throws a version conflict and does not persist history for a stale write', async () => {
    mockUpdate(0);

    await expect(
      userRepo.update(user, {
        correlationId: 'correlation-id',
        expectedVersion: 1,
        history,
      })
    ).rejects.toBeInstanceOf(repoError.VersionNotFound);

    expect(userHistoryRepo.save).not.toHaveBeenCalled();
  });

  it('rejects a history-version mismatch before opening a transaction', async () => {
    await expect(
      userRepo.update(user, {
        correlationId: 'correlation-id',
        expectedVersion: 1,
        history: { entityId: user.id, entityVersion: 3 } as never,
      })
    ).rejects.toBeInstanceOf(repoError.VersionMismatch);

    expect(getDbQuery).not.toHaveBeenCalled();
  });
});
