import { ICounterpartyHistory } from '../../../../../../domain/counterparty/types/counterparty-audit.types';
import {
  ICounterparty,
  UCounterpartyRole,
} from '../../../../../../domain/counterparty/types/counterparty.types';
import { IWriteRepoOptions } from '../../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import {
  counterpartiesInCore,
  counterpartyRolesInCore,
} from '../../../../../config/drizzle/schema';
import getDbQuery from '../../../../helpers/get-db-query';
import counterpartyHistoryRepo from '../../counterparty-history.repo.impl';
import counterpartyRepo from '../../counterparty.repo.impl';
import counterpartyRoleMapper from '../counterparty-role.mapper';
import counterpartyMapper from '../counterparty.mapper';

jest.mock('../../../../helpers/get-db-query');
jest.mock('../counterparty.mapper');
jest.mock('../counterparty-role.mapper');
jest.mock('../../counterparty-history.repo.impl');

describe('CounterpartyRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const payload: ICounterparty = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    name: 'Acme Corp',
    status: 'active',
    type: 'organization',
    roles: [],
    createdAt: now,
    updatedAt: now,
  };

  const history: ICounterpartyHistory = {
    entityId: payload.id,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: payload,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  const options: IWriteRepoOptions<ICounterpartyHistory> = {
    correlationId: 'test-correlation-id',
    history,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists counterparty row and history in the same transaction when roles is empty', async () => {
    const valuesMock = jest.fn().mockResolvedValue(undefined);
    const insertMock = jest.fn().mockReturnValue({ values: valuesMock });
    const tx = {
      insert: insertMock,
    };
    const query = {
      transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<void>) =>
          callback(tx)
      ),
    };
    const repoValue = { id: payload.id, name: payload.name };

    (getDbQuery as jest.Mock).mockReturnValue(query);
    (counterpartyMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await counterpartyRepo.create(payload, options);

    expect(counterpartyMapper.toRepo).toHaveBeenCalledWith(payload);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(counterpartiesInCore);
    expect(valuesMock).toHaveBeenCalledWith(repoValue);

    expect(counterpartyHistoryRepo.save).toHaveBeenCalledWith(
      payload,
      options.history,
      expect.objectContaining({
        correlationId: options.correlationId,
        tx,
      })
    );

    expect(counterpartyRoleMapper.toRepoMany).not.toHaveBeenCalled();
  });

  it('persists counterparty row, history, and role rows in the same transaction when roles is non-empty', async () => {
    const payloadWithRoles: ICounterparty = {
      ...payload,
      roles: ['vendor' as UCounterpartyRole, 'employer' as UCounterpartyRole],
    };

    const valuesMock = jest.fn().mockResolvedValue(undefined);
    const insertMock = jest.fn().mockReturnValue({ values: valuesMock });
    const tx = {
      insert: insertMock,
    };
    const query = {
      transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<void>) =>
          callback(tx)
      ),
    };
    const repoValue = { id: payloadWithRoles.id, name: payloadWithRoles.name };
    const mappedRoles = [
      { counterpartyId: payloadWithRoles.id, role: 'vendor' },
      { counterpartyId: payloadWithRoles.id, role: 'employer' },
    ];

    (getDbQuery as jest.Mock).mockReturnValue(query);
    (counterpartyMapper.toRepo as jest.Mock).mockReturnValue(repoValue);
    (counterpartyRoleMapper.toRepoMany as jest.Mock).mockReturnValue(
      mappedRoles
    );

    await counterpartyRepo.create(payloadWithRoles, options);

    expect(counterpartyMapper.toRepo).toHaveBeenCalledWith(payloadWithRoles);
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenNthCalledWith(1, counterpartiesInCore);
    expect(insertMock).toHaveBeenNthCalledWith(2, counterpartyRolesInCore);
    expect(valuesMock).toHaveBeenNthCalledWith(1, repoValue);
    expect(valuesMock).toHaveBeenNthCalledWith(2, mappedRoles);

    expect(counterpartyHistoryRepo.save).toHaveBeenCalledWith(
      payloadWithRoles,
      options.history,
      expect.objectContaining({
        correlationId: options.correlationId,
        tx,
      })
    );

    expect(counterpartyRoleMapper.toRepoMany).toHaveBeenCalledWith(
      payloadWithRoles.id,
      payloadWithRoles.roles
    );
  });

  it('propagates database error when transaction fails', async () => {
    const databaseError = new Error('database failure');
    const query = {
      transaction: jest.fn().mockRejectedValue(databaseError),
    };
    (getDbQuery as jest.Mock).mockReturnValue(query);

    await expect(counterpartyRepo.create(payload, options)).rejects.toBe(
      databaseError
    );
  });
});
