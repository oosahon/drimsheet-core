import mockHasher from '../../../../shared/contracts/__mocks__/hasher.mock';
import authError from '../../errors/auth.error';
import makePasswordService from '../password.service';

describe('makePasswordService', () => {
  let passwordService: ReturnType<typeof makePasswordService>;

  beforeEach(() => {
    mockHasher.genSalt.mockReset().mockResolvedValue('mock-salt');
    mockHasher.hash.mockReset().mockResolvedValue('hashed-password');
    mockHasher.compare
      .mockReset()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    passwordService = makePasswordService({ hasher: mockHasher });
  });

  describe('makePassword', () => {
    it('returns a valid password without normalizing it', () => {
      const password = '  StrongPassword1!  ';
      expect(passwordService.makePassword(password)).toBe(password);
    });

    it('accepts both exact length boundaries', () => {
      const minimum = 'Aa1!aaaa';
      const maximum = `StrongPassword1!${'a'.repeat(
        128 - 'StrongPassword1!'.length
      )}`;

      expect(passwordService.makePassword(minimum)).toBe(minimum);
      expect(passwordService.makePassword(maximum)).toBe(maximum);
    });

    it.each([
      null,
      undefined,
      123,
      'Aa1!aaa',
      `Aa1!${'a'.repeat(125)}`,
      'password123!',
      'PASSWORD123!',
      'PasswordTest!',
      'Password123',
    ])('rejects an invalid password: %p', (input) => {
      expect(() => passwordService.makePassword(input)).toThrow(
        authError.InvalidPassword
      );
    });
  });

  it('hashes passwords and compares them without exposing the plaintext', async () => {
    const password = 'mySecretPassword123!';
    const hash = await passwordService.hash(password);

    expect(hash).not.toBe(password);
    expect(mockHasher.genSalt).toHaveBeenCalledWith(10);
    expect(mockHasher.hash).toHaveBeenCalledWith(password, 'mock-salt');
    await expect(passwordService.compare(password, hash)).resolves.toBe(true);
    await expect(passwordService.compare('wrongPassword', hash)).resolves.toBe(
      false
    );
    expect(mockHasher.compare).toHaveBeenNthCalledWith(1, password, hash);
    expect(mockHasher.compare).toHaveBeenNthCalledWith(
      2,
      'wrongPassword',
      hash
    );
  });
});
