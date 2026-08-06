import { IContractor } from '../../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import contractorMapper, { IContractorModel } from '../contractor.mapper';

describe('contractorMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const entity: IContractor = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    address: {
      line1: '123 Main St',
      line2: 'Suite 100',
      city: 'Metropolis',
      region: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    },
    createdAt: now,
  };

  const repoModel: IContractorModel = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001',
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    addressCity: 'Metropolis',
    addressRegion: 'NY',
    addressPostalCode: '10001',
    addressCountryCode: 'US',
    createdAt: now.toISOString(),
  };

  it('maps domain entity to repo model', () => {
    const result = contractorMapper.toRepo(entity);
    expect(result).toEqual(repoModel);
  });

  it('maps repo model to domain entity', () => {
    const result = contractorMapper.toDomain(repoModel);

    expect(result).toEqual(entity);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.address)).toBe(true);
  });
});
