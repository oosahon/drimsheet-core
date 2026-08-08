import { TEntityId } from '@shared/types/uuid';

import { UCounterpartyRole } from '@domain/counterparty/types/counterparty.types';

import counterpartyRoleMapper from '@infra/persistence/repos/counterparty/mappers/counterparty-role.mapper';

describe('counterpartyRoleMapper', () => {
  const counterpartyId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  it('maps single role to repo shape', () => {
    const role: UCounterpartyRole = 'vendor';
    const result = counterpartyRoleMapper.toRepo(counterpartyId, role);

    expect(result).toEqual({
      counterpartyId,
      role: 'vendor',
    });
  });

  it('maps multiple roles to repo shapes', () => {
    const roles: UCounterpartyRole[] = ['vendor', 'employer'];
    const result = counterpartyRoleMapper.toRepoMany(counterpartyId, roles);

    expect(result).toEqual([
      { counterpartyId, role: 'vendor' },
      { counterpartyId, role: 'employer' },
    ]);
  });
});
