import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { ECategoryEvent } from '../../events/category.events';
import {
  ECategoryHistoryAction,
  ECategoryStatus,
  ICategory,
  UCategoryStatus,
} from '../../types/category.types';
import categoryEntity from '../category.entity';
import categoryEntityHelpers from '../helpers/category.entity.helpers';

describe('Category Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should successfully create a category with valid inputs', () => {
      const payload: TCreationOmits<ICategory, 'version'> = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Test Category',
        accountMaterializedPath: '100000.100001',
        status: ECategoryStatus.Active,
        isGrouping: false,
      };

      const [category, events] = categoryEntity.make(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECategoryEvent.CategoryCreated);
      expect(events[0].data).toEqual(category);

      expect(typeof category.id).toBe('string');
      expect(category.id.length).toBeGreaterThan(0);
      expect(category.accountingEntityId).toBe(
        '2b4c10ab-5c31-419b-ab29-688001d9f8e4'
      );
      expect(category.accountId).toBe('d571fba2-d5cb-43dc-8e6c-2f3b97b0a70f');
      expect(category.name).toBe('Test Category');
      expect(category.accountMaterializedPath).toBe('100000.100001');
      expect(category.status).toBe(ECategoryStatus.Active);
      expect(category.isGrouping).toBe(false);
      expect(category.version).toBe(1);
      expect(category.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(category.updatedAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(Object.isFrozen(category)).toBe(true);
    });

    it('should throw an AppError if accountingEntityId is invalid', () => {
      const payload: TCreationOmits<ICategory, 'version'> = {
        accountingEntityId: 'invalid-uuid' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Test Category',
        accountMaterializedPath: '100000.100001',
        status: ECategoryStatus.Active,
        isGrouping: false,
      };

      expect(() => categoryEntity.make(payload)).toThrow();
    });

    it('should throw an AppError if accountId is invalid', () => {
      const payload: TCreationOmits<ICategory, 'version'> = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'invalid-uuid' as TEntityId,
        name: 'Test Category',
        accountMaterializedPath: '100000.100001',
        status: ECategoryStatus.Active,
        isGrouping: false,
      };

      expect(() => categoryEntity.make(payload)).toThrow();
    });
  });

  describe('update', () => {
    let baseCategory: ICategory;

    beforeEach(() => {
      [baseCategory] = categoryEntity.make({
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Old Name',
        accountMaterializedPath: '100000.100001',
        status: ECategoryStatus.Active,
        isGrouping: false,
      });

      jest.setSystemTime(new Date('2026-04-16T00:00:00.000Z'));
    });

    it('should successfully update relevant fields and bump version', () => {
      const [updatedCategory, events] = categoryEntity.update(baseCategory, {
        name: 'New Name',
        isGrouping: true,
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECategoryEvent.CategoryUpdated);
      expect(events[0].data).toEqual(updatedCategory);

      expect(updatedCategory.name).toBe('New Name');
      expect(updatedCategory.isGrouping).toBe(true);
      expect(updatedCategory.version).toBe(2);
      expect(updatedCategory.updatedAt).toEqual(
        new Date('2026-04-16T00:00:00.000Z')
      );
      expect(Object.isFrozen(updatedCategory)).toBe(true);
    });

    it('should return the original category with no events if no changes are made', () => {
      const [updatedCategory, events] = categoryEntity.update(baseCategory, {
        name: 'Old Name',
        isGrouping: false,
      });

      expect(events).toHaveLength(0);
      expect(updatedCategory).toEqual(baseCategory);
    });

    it('should return the original category with no events if options are empty', () => {
      const [updatedCategory, events] = categoryEntity.update(baseCategory, {});

      expect(events).toHaveLength(0);
      expect(updatedCategory).toEqual(baseCategory);
    });
  });

  describe('makeHistory', () => {
    let mockCurrentCategory: ICategory;

    beforeEach(() => {
      mockCurrentCategory = {
        id: '3c8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Test Category',
        accountMaterializedPath: '100000.100001',
        status: ECategoryStatus.Active,
        isGrouping: false,
        version: 1,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
        updatedAt: new Date('2026-04-15T00:00:00.000Z'),
        deletedAt: null,
      };
    });

    it('should successfully create a history log with valid inputs', () => {
      const payload = {
        current: mockCurrentCategory,
        previous: null,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryAction.Created,
        note: 'Initial creation',
      };

      const log = categoryEntity.makeHistory(payload);

      expect(log.categoryId).toBe('3c8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.userId).toBe('4d8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.action).toBe(ECategoryHistoryAction.Created);
      expect(log.note).toBe('Initial creation');
      expect(log.diff).toBeDefined();
      expect(log.diff.after).toEqual(mockCurrentCategory);
      expect(log.diff.before).toEqual({});
      expect(log.createdAt).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(Object.isFrozen(log)).toBe(true);
    });

    it('should successfully capture diff between previous and current', () => {
      const payload = {
        current: { ...mockCurrentCategory, name: 'New Test', version: 2 },
        previous: mockCurrentCategory,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryAction.Updated,
        note: null,
      };

      const log = categoryEntity.makeHistory(payload);

      expect(log.action).toBe(ECategoryHistoryAction.Updated);
      expect(log.diff.before).toEqual({ name: 'Test Category', version: 1 });
      expect(log.diff.after).toEqual({ name: 'New Test', version: 2 });
    });

    it('should throw an AppError if current.id is invalid', () => {
      const payload = {
        current: { ...mockCurrentCategory, id: 'invalid-uuid' as TEntityId },
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryAction.Updated,
        note: null,
      };

      expect(() => categoryEntity.makeHistory(payload)).toThrow();
    });

    it('should throw an AppError if userId is invalid', () => {
      const payload = {
        current: mockCurrentCategory,
        userId: 'invalid-uuid' as TEntityId,
        action: ECategoryHistoryAction.Created,
        note: null,
      };

      expect(() => categoryEntity.makeHistory(payload)).toThrow();
    });

    it('should sanitize and validate note appropriately', () => {
      const payload = {
        current: mockCurrentCategory,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryAction.Created,
        note: '   Trim me   ',
      };

      const log = categoryEntity.makeHistory(payload);
      expect(log.note).toBe('Trim me');
    });
  });

  describe('Helpers', () => {
    describe('validateStatus', () => {
      it('should not throw for a valid status', () => {
        expect(() =>
          categoryEntityHelpers.validateStatus(ECategoryStatus.Active)
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid status', () => {
        expect(() =>
          categoryEntityHelpers.validateStatus('invalid' as UCategoryStatus)
        ).toThrow();
      });
    });

    describe('sanitizeName', () => {
      it('should return sanitized name', () => {
        expect(categoryEntityHelpers.sanitizeName('  Valid Name  ')).toBe(
          'Valid Name'
        );
      });

      it('should throw if name is empty or too long', () => {
        expect(() => categoryEntityHelpers.sanitizeName('')).toThrow();
        expect(() =>
          categoryEntityHelpers.sanitizeName('a'.repeat(101))
        ).toThrow();
      });
    });

    describe('getHistoryNote', () => {
      it('should return null if note is falsy', () => {
        expect(categoryEntityHelpers.getHistoryNote(null)).toBeNull();
        expect(categoryEntityHelpers.getHistoryNote('')).toBeNull();
      });

      it('should return sanitized note', () => {
        expect(categoryEntityHelpers.getHistoryNote('  Valid Note  ')).toBe(
          'Valid Note'
        );
      });

      it('should throw if note is too long', () => {
        expect(() =>
          categoryEntityHelpers.getHistoryNote('a'.repeat(101))
        ).toThrow();
      });
    });

    describe('validateHistoryAction', () => {
      it('should not throw for a valid action', () => {
        expect(() =>
          categoryEntityHelpers.validateHistoryAction(
            ECategoryHistoryAction.Created
          )
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid action', () => {
        expect(() =>
          // @ts-expect-error Testing invalid action at runtime
          categoryEntityHelpers.validateHistoryAction('invalid')
        ).toThrow();
      });
    });
  });
});
