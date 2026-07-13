import { TEntityId } from '../../../../shared/types/uuid';
import mockAccountingEntityRepo from '../../repos/__mocks__/accounting-entity.repo.impl.mock';
import { IAccountingEntity } from '../../types/accounting-entity.types';
import makeAccountingEntityService from '../accounting-entity.service';

describe('accountingEntityService', () => {
  const service = makeAccountingEntityService({
    accountingEntityRepo: mockAccountingEntityRepo,
  });

  describe('grantUserAccess', () => {
    it('should return true if user is owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(service.grantUserAccess(entity, 'user-1' as TEntityId)).toBe(true);
    });

    it('should return false if user is not owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(service.grantUserAccess(entity, 'user-2' as TEntityId)).toBe(
        false
      );
    });
  });

  describe('validateAccess', () => {
    it('should not throw if user is owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(() =>
        service.validateAccess(entity, 'user-1' as TEntityId)
      ).not.toThrow();
    });

    it('should throw UnauthorizedUserAccess if user is not owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(() =>
        service.validateAccess(entity, 'user-2' as TEntityId)
      ).toThrow();
    });
  });
});
