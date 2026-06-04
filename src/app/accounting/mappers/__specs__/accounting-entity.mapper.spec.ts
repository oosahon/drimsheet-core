import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { TEntityId } from '../../../../shared/types/uuid';
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
    type: 'private_company',
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
    createdAt,
    updatedAt,
  };

  const repoModel: IAccountingEntityModel = {
    id: 'entity-1',
    ownerId: 'user-1',
    name: 'Purple Ledger Corp',
    type: 'private_company',
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  describe('toRepo', () => {
    it('should map a domain accounting entity to a repo model', () => {
      expect(accountingEntityMapper.toRepo(domainEntity)).toEqual(repoModel);
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to a domain accounting entity', () => {
      expect(accountingEntityMapper.toDomain(repoModel)).toEqual(domainEntity);
    });
  });

  describe('toInterface', () => {
    it('should map domain accounting entity to interface representation', () => {
      const interfaceEntity = accountingEntityMapper.toInterface(domainEntity);

      expect(interfaceEntity.id).toBe(domainEntity.id);
      expect(interfaceEntity.type).toBe('private_company');
      expect(interfaceEntity.name).toBe('Purple Ledger Corp');
    });
  });
});
