import { TEntityId } from '@shared/types/uuid';

import { IVendor } from '@domain/counterparty/types/counterparty.types';

import vendorMapper, {
  IVendorModel,
} from '@infra/persistence/repos/counterparty/mappers/vendor.mapper';

describe('vendorMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const entityWithAddress: IVendor = {
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

  const repoModelWithAddress: IVendorModel = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001',
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    addressCity: 'Metropolis',
    addressRegion: 'NY',
    addressPostalCode: '10001',
    addressCountryCode: 'US',
    createdAt: now.toISOString(),
  };

  const entityWithoutAddress: IVendor = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    address: null,
    createdAt: now,
  };

  const repoModelWithoutAddress: IVendorModel = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001',
    addressLine1: null,
    addressLine2: null,
    addressCity: null,
    addressRegion: null,
    addressPostalCode: null,
    addressCountryCode: null,
    createdAt: now.toISOString(),
  };

  it('maps domain entity to repo model (with address)', () => {
    const result = vendorMapper.toRepo(entityWithAddress);
    expect(result).toEqual(repoModelWithAddress);
  });

  it('maps domain entity to repo model (without address)', () => {
    const result = vendorMapper.toRepo(entityWithoutAddress);
    expect(result).toEqual(repoModelWithoutAddress);
  });

  it('maps repo model to domain entity (with address)', () => {
    const result = vendorMapper.toDomain(repoModelWithAddress);

    expect(result).toEqual(entityWithAddress);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.address)).toBe(true);
  });

  it('maps repo model to domain entity (without address)', () => {
    const result = vendorMapper.toDomain(repoModelWithoutAddress);

    expect(result).toEqual(entityWithoutAddress);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.address).toBeNull();
  });
});
