import authError from '../../../errors/auth.error';
import {
  emailLoginReqValidation,
  resetPasswordReqValidation,
  userSignupReqValidation,
  validatePassword,
} from '../auth.dto.validation';

describe('Auth DTO Validation', () => {
  describe('validatePassword', () => {
    it('should return true for a valid password', () => {
      const result = validatePassword.safeParse('ValidPass1!');
      expect(result.success).toBe(true);
    });

    it('should return auth_error_invalid_password for invalid passwords', () => {
      const invalidPasswords = [
        'short', // too short (<8)
        'a'.repeat(101), // too long (>100)
        'no-number-password!', // no number
        'NoSpecial123', // no special character
      ];

      for (const pass of invalidPasswords) {
        const result = validatePassword.safeParse(pass);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            new authError.InvalidPassword().errorKey
          );
        }
      }
    });
  });
  describe('userSignupReqValidation', () => {
    it('should pass for a valid signup payload', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      };

      const result = userSignupReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail with auth_error_invalid_first_name when firstName is empty', () => {
      const payload = {
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      };

      const result = userSignupReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidFirstName().errorKey
        );
      }
    });

    it('should fail with auth_error_invalid_last_name when lastName is empty', () => {
      const payload = {
        firstName: 'John',
        lastName: '',
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      };

      const result = userSignupReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidLastName().errorKey
        );
      }
    });

    it('should fail with auth_error_invalid_email when email is invalid', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
        password: 'ValidPassword123!',
      };

      const result = userSignupReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidEmail().errorKey
        );
      }
    });

    it('should fail with auth_error_invalid_password when password is invalid', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'weak',
      };

      const result = userSignupReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidPassword().errorKey
        );
      }
    });
  });

  describe('emailLoginReqValidation', () => {
    it('should pass for a valid login payload', () => {
      const payload = {
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      };

      const result = emailLoginReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail with auth_error_invalid_email when email is invalid', () => {
      const payload = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
      };

      const result = emailLoginReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidEmail().errorKey
        );
      }
    });

    it('should fail with auth_error_invalid_password when password is invalid', () => {
      const payload = {
        email: 'john.doe@example.com',
        password: '',
      };

      const result = emailLoginReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidPassword().errorKey
        );
      }
    });
  });

  describe('resetPasswordReqValidation', () => {
    it('should pass for valid reset password payload', () => {
      const payload = {
        token: 'valid-reset-token',
        password: 'NewValidPassword123!',
        confirmPassword: 'NewValidPassword123!',
      };

      const result = resetPasswordReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail with auth_error_invalid_token when token is empty', () => {
      const payload = {
        token: '',
        password: 'NewValidPassword123!',
        confirmPassword: 'NewValidPassword123!',
      };

      const result = resetPasswordReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidToken().errorKey
        );
      }
    });

    it('should fail with auth_error_invalid_password when password is invalid', () => {
      const payload = {
        token: 'valid-token',
        password: 'short',
        confirmPassword: 'short',
      };

      const result = resetPasswordReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.InvalidPassword().errorKey
        );
      }
    });

    it('should fail with auth_error_passwords_do_not_match when passwords do not match', () => {
      const payload = {
        token: 'valid-token',
        password: 'NewValidPassword123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = resetPasswordReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          new authError.PasswordsDoNotMatch().errorKey
        );
      }
    });
  });
});
