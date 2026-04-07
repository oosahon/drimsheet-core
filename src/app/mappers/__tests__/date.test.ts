import {
  toRepoDate,
  fromRepoDate,
  fromCommonRepoDates,
  toCommonRepoDates,
} from '../date';

describe('Date Mappers', () => {
  describe('toRepoDate', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2026-03-14T10:00:00.000Z');
      expect(toRepoDate(date)).toBe('2026-03-14T10:00:00.000Z');
    });
  });

  describe('fromRepoDate', () => {
    it('should convert ISO string to Date', () => {
      const dateStr = '2026-03-14T10:00:00.000Z';
      expect(fromRepoDate(dateStr)).toBeInstanceOf(Date);
      expect(fromRepoDate(dateStr).toISOString()).toBe(dateStr);
    });
  });

  describe('fromCommonRepoDates', () => {
    it('should correctly map repo dates to domain dates without deletedAt', () => {
      const payload = {
        createdAt: '2026-03-14T10:00:00.000Z',
        updatedAt: '2026-03-14T11:00:00.000Z',
        deletedAt: null,
      };

      const result = fromCommonRepoDates(payload);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.toISOString()).toBe('2026-03-14T10:00:00.000Z');
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.toISOString()).toBe('2026-03-14T11:00:00.000Z');
      expect(result.deletedAt).toBeNull();
    });

    it('should correctly map repo dates to domain dates with deletedAt', () => {
      const payload = {
        createdAt: '2026-03-14T10:00:00.000Z',
        updatedAt: '2026-03-14T11:00:00.000Z',
        deletedAt: '2026-03-14T12:00:00.000Z',
      };

      const result = fromCommonRepoDates(payload);

      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(result.deletedAt?.toISOString()).toBe('2026-03-14T12:00:00.000Z');
    });
  });

  describe('toCommonRepoDates', () => {
    it('should correctly map domain dates to repo dates without deletedAt', () => {
      const payload = {
        createdAt: new Date('2026-03-14T10:00:00.000Z'),
        updatedAt: new Date('2026-03-14T11:00:00.000Z'),
        deletedAt: null,
      };

      const result = toCommonRepoDates(payload);

      expect(result.createdAt).toBe('2026-03-14T10:00:00.000Z');
      expect(result.updatedAt).toBe('2026-03-14T11:00:00.000Z');
      expect(result.deletedAt).toBeNull();
    });

    it('should correctly map domain dates to repo dates with deletedAt', () => {
      const payload = {
        createdAt: new Date('2026-03-14T10:00:00.000Z'),
        updatedAt: new Date('2026-03-14T11:00:00.000Z'),
        deletedAt: new Date('2026-03-14T12:00:00.000Z'),
      };

      const result = toCommonRepoDates(payload);

      expect(result.deletedAt).toBe('2026-03-14T12:00:00.000Z');
    });
  });
});
