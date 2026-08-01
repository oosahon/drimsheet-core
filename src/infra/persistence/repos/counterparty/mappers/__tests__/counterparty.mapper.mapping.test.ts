import {
  ECounterpartyRole,
  ECounterpartyStatus,
  ECounterpartyType,
  ICounterparty,
} from '../../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import counterpartyMapper, { ICounterpartyModel } from '../counterparty.mapper';

describe('counterpartyMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');

  const entity: ICounterparty = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    name: 'Acme Corp',
    status: ECounterpartyStatus.Active,
    type: ECounterpartyType.Organization,
    roles: [ECounterpartyRole.Vendor],
    createdAt: now,
    updatedAt: now,
  };

  const repoModel: ICounterpartyModel = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Acme Corp',
    status: ECounterpartyStatus.Active,
    type: ECounterpartyType.Organization,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  it('maps domain entity to repo model', () => {
    const result = counterpartyMapper.toRepo(entity);

    expect(result).toEqual(repoModel);
  });

  it('maps repo model to domain entity with copied roles', () => {
    const roles = [ECounterpartyRole.Vendor, ECounterpartyRole.Employer];

    const result = counterpartyMapper.toDomain(repoModel, roles);

    expect(result).toEqual({
      ...entity,
      roles,
    });
    expect(result.roles).not.toBe(roles);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('maps repo model to domain entity with empty roles by default', () => {
    const result = counterpartyMapper.toDomain(repoModel);

    expect(result).toEqual({
      ...entity,
      roles: [],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});
