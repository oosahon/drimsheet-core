import {
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
  });

  describe('userSignupReqValidation', () => {
    it('accepts a valid signup payload without transforming the password', () => {
      const password = '  StrongPassword1!  ';
      const result = userSignupReqValidation.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password,
      });

      expect(result.success).toBe(true);
      if (!result.success) {
        throw result.error;
      }
      expect(result.data.password).toBe(password);
    });
  });
});
