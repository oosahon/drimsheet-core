import {
  emailLoginReqValidation,
  userSignupReqValidation,
  validatePassword,
} from '../auth.dto.validation';

describe('auth DTO validation', () => {
  describe('validatePassword', () => {
    const validPassword = 'StrongPassword1!';

    it.each([
      ['an uppercase letter', 'strongpassword1!'],
      ['a lowercase letter', 'STRONGPASSWORD1!'],
      ['a digit', 'StrongPassword!'],
      ['a special character', 'StrongPassword1'],
    ])('rejects a password without %s', (_requirement, password) => {
      expect(validatePassword.safeParse(password).success).toBe(false);
    });

    it('accepts the same maximum length as the password value object', () => {
      const password = `${validPassword}${'a'.repeat(
        128 - validPassword.length
      )}`;

      expect(password).toHaveLength(128);
      expect(validatePassword.safeParse(password).success).toBe(true);
    });

    it('accepts the exact minimum length', () => {
      expect(validatePassword.safeParse('Aa1!aaaa').success).toBe(true);
    });

    it.each(['Aa1!aaa', `Aa1!${'a'.repeat(125)}`])(
      'rejects passwords outside the shared length boundaries',
      (password) => {
        expect(validatePassword.safeParse(password).success).toBe(false);
      }
    );
  });

  describe('userSignupReqValidation', () => {
    it('accepts a valid signup payload without transforming the password', () => {
      const password = '  StrongPassword1!  ';
      const result = userSignupReqValidation.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: '  JOHN@EXAMPLE.COM  ',
        password,
      });

      expect(result.success).toBe(true);
      if (!result.success) {
        throw result.error;
      }
      expect(result.data.password).toBe(password);
      expect(result.data.email).toBe('john@example.com');
    });
  });

  describe('emailLoginReqValidation', () => {
    it('accepts a previously registered 128-character password', () => {
      const password = `Aa1!${'a'.repeat(124)}`;

      expect(
        emailLoginReqValidation.safeParse({
          email: 'user@example.com',
          password,
        }).success
      ).toBe(true);
    });
  });
});
