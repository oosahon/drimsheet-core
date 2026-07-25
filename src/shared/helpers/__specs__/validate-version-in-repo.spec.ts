import repoError from '../../errors/repo.error';
import validateVersionInOptions from '../validate-version-in-repo';

describe('validateVersionInOptions', () => {
  it('throws VersionRequired error when expectedVersion is undefined', () => {
    expect(() =>
      validateVersionInOptions({ correlationId: '123' } as any)
    ).toThrow(repoError.VersionRequired);
  });

  it('throws VersionRequired error when expectedVersion is 0', () => {
    expect(() =>
      validateVersionInOptions({
        correlationId: '123',
        expectedVersion: 0,
      } as any)
    ).toThrow(repoError.VersionRequired);
  });

  it('throws VersionRequired error when expectedVersion is negative', () => {
    expect(() =>
      validateVersionInOptions({
        correlationId: '123',
        expectedVersion: -1,
      } as any)
    ).toThrow(repoError.VersionRequired);
  });

  it('does not throw when expectedVersion is a positive number', () => {
    expect(() =>
      validateVersionInOptions({
        correlationId: '123',
        expectedVersion: 1,
      } as any)
    ).not.toThrow();
    expect(() =>
      validateVersionInOptions({
        correlationId: '123',
        expectedVersion: 100,
      } as any)
    ).not.toThrow();
  });
});
