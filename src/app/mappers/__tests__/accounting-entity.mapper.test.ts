import { IAccountingEntity } from '../../../domain/accounting-entity/types/accounting-entity.types';
import { TEntityId } from '../../../shared/types/uuid';
import accountingEntityMapper, {
  IAccountingEntityModel,
} from '../accounting-entity.mapper';

describe('Accounting Entity Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');

  const domainEntity: IAccountingEntity = {
    id: 'entity-1' as TEntityId,
    ownerId: 'user-1' as TEntityId,
    name: 'Purple Ledger Corp',
    operatingCountryCode: 'US',
    functionalCurrency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      minorUnit: 2n,
    },
    reportingCurrency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      minorUnit: 2n,
    },
    type: 'company',
    fiscalYearStart: {
      month: 1,
      day: 1,
    },
    createdAt,
    updatedAt,
    deletedAt: null,
  };

  const repoModel: IAccountingEntityModel = {
    id: 'entity-1',
    ownerId: 'user-1',
    name: 'Purple Ledger Corp',
    operatingCountryCode: 'US',
    functionalCurrencyCode: 'USD',
    reportingCurrencyCode: 'USD',
    type: 'company',
    fiscalYearStartMonth: 1,
    fiscalYearStartDay: 1,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: null,
  };

  const currencyRepoModel = {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnit: 2,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: null,
  };

  describe('toRepo', () => {
    it('should map a domain accounting entity to a repo model', () => {
      expect(accountingEntityMapper.toRepo(domainEntity)).toEqual(repoModel);
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to a domain accounting entity', () => {
      const payload: Parameters<typeof accountingEntityMapper.toDomain>[0] = {
        ...repoModel,
        functionalCurrency: currencyRepoModel,
        reportingCurrency: currencyRepoModel,
      };

      expect(accountingEntityMapper.toDomain(payload)).toEqual(domainEntity);
    });
  });

  describe('toInterface', () => {
    it('should map domain accounting entity to interface representation', () => {
      const interfaceEntity = accountingEntityMapper.toInterface(domainEntity);

      expect(interfaceEntity.id).toBe(domainEntity.id);
      expect(interfaceEntity.functionalCurrency).toBe('USD');
      expect(interfaceEntity.reportingCurrency).toBe('USD');
    });
  });
});
