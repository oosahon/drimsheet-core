import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { ECategoryEvent } from '../../events/category.events';
import {
  ECategoryHistoryLogAction,
  ICategory,
} from '../../types/category.types';
import categoryEntity from '../category.entity';

describe('Category Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('makeCategory', () => {
    it('should successfully create a category with valid inputs', () => {
      const payload: TCreationOmits<ICategory, 'version'> = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Test Category',
        key: '100000.100001',
        isGrouping: false,
      };

      const [category, events] = categoryEntity.makeCategory(payload);

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
      expect(category.key).toBe('100000.100001');
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
        key: '100000.100001',
        isGrouping: false,
      };

      expect(() => categoryEntity.makeCategory(payload)).toThrow(AppError);
    });

    it('should throw an AppError if accountId is invalid', () => {
      const payload: TCreationOmits<ICategory, 'version'> = {
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'invalid-uuid' as TEntityId,
        name: 'Test Category',
        key: '100000.100001',
        isGrouping: false,
      };

      expect(() => categoryEntity.makeCategory(payload)).toThrow(AppError);
    });
  });

  describe('updateCategory', () => {
    let baseCategory: ICategory;

    beforeEach(() => {
      [baseCategory] = categoryEntity.makeCategory({
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Old Name',
        key: '100000.100001',
        isGrouping: false,
      });

      jest.setSystemTime(new Date('2026-04-16T00:00:00.000Z'));
    });

    it('should successfully update relevant fields and bump version', () => {
      const [updatedCategory, events] = categoryEntity.updateCategory(
        baseCategory,
        {
          name: 'New Name',
          displayName: 'New Display Name',
          key: '100000.100001.100002',
          isGrouping: true,
          accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECategoryEvent.CategoryUpdated);
      expect(events[0].data).toEqual(updatedCategory);

      expect(updatedCategory.name).toBe('New Name');
      expect(updatedCategory.displayName).toBe('New Display Name');
      expect(updatedCategory.key).toBe('100000.100001.100002');
      expect(updatedCategory.isGrouping).toBe(true);
      expect(updatedCategory.version).toBe(2);
      expect(updatedCategory.updatedAt).toEqual(
        new Date('2026-04-16T00:00:00.000Z')
      );
      expect(Object.isFrozen(updatedCategory)).toBe(true);
    });

    it('should return the original category with no events if no changes are made', () => {
      const [updatedCategory, events] = categoryEntity.updateCategory(
        baseCategory,
        {
          name: 'Old Name',
          key: '100000.100001',
          isGrouping: false,
          accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        }
      );

      expect(events).toHaveLength(0);
      expect(updatedCategory).toEqual(baseCategory);
    });

    it('should return the original category with no events if options are empty', () => {
      const [updatedCategory, events] = categoryEntity.updateCategory(
        baseCategory,
        {}
      );

      expect(events).toHaveLength(0);
      expect(updatedCategory).toEqual(baseCategory);
    });
  });

  describe('makeHistoryLog', () => {
    let mockCurrentCategory: ICategory;

    beforeEach(() => {
      mockCurrentCategory = {
        id: '3c8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountingEntityId: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        name: 'Test Category',
        key: '100000.100001',
        isGrouping: false,
        version: 1,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
        updatedAt: new Date('2026-04-15T00:00:00.000Z'),
      };
    });

    it('should successfully create a history log with valid inputs', () => {
      const payload = {
        current: mockCurrentCategory,
        previous: null,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryLogAction.Created,
        note: 'Initial creation',
      };

      const log = categoryEntity.makeHistoryLog(payload);

      expect(log.categoryId).toBe('3c8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.userId).toBe('4d8e10ab-5c31-419b-ab29-688001d9f8e4');
      expect(log.action).toBe(ECategoryHistoryLogAction.Created);
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
        action: ECategoryHistoryLogAction.Updated,
        note: null,
      };

      const log = categoryEntity.makeHistoryLog(payload);

      expect(log.action).toBe(ECategoryHistoryLogAction.Updated);
      expect(log.diff.before).toEqual({ name: 'Test Category', version: 1 });
      expect(log.diff.after).toEqual({ name: 'New Test', version: 2 });
    });

    it('should throw an AppError if current.id is invalid', () => {
      const payload = {
        current: { ...mockCurrentCategory, id: 'invalid-uuid' as TEntityId },
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryLogAction.Updated,
        note: null,
      };

      expect(() => categoryEntity.makeHistoryLog(payload)).toThrow(AppError);
    });

    it('should throw an AppError if userId is invalid', () => {
      const payload = {
        current: mockCurrentCategory,
        userId: 'invalid-uuid' as TEntityId,
        action: ECategoryHistoryLogAction.Created,
        note: null,
      };

      expect(() => categoryEntity.makeHistoryLog(payload)).toThrow(AppError);
    });

    it('should sanitize and validate note appropriately', () => {
      const payload = {
        current: mockCurrentCategory,
        userId: '4d8e10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        action: ECategoryHistoryLogAction.Created,
        note: '   Trim me   ',
      };

      const log = categoryEntity.makeHistoryLog(payload);
      expect(log.note).toBe('Trim me');
    });
  });
});
