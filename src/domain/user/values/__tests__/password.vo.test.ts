import userValueObjectError from '../../errors/user-value-object.error';
import password from '../password.vo';

describe('Password Value Object', () => {
  describe('make()', () => {
    it('should create a valid password', () => {
      const validPassword = 'StrongPassword1!';
      expect(password.make(validPassword)).toBe(validPassword);
    });

    it('should preserve surrounding whitespace in a valid password', () => {
      const validPassword = '  StrongPassword1!  ';
      expect(password.make(validPassword)).toBe(validPassword);
    });

    it('should throw an AppError if the input is not a string', () => {
      const invalidInputs: unknown[] = [null, undefined, 123, {}, []];

      invalidInputs.forEach((input) => {
        expect(() => password.make(input)).toThrow(
          userValueObjectError.InvalidType
        );
      });
    });

    it('should throw an AppError if the password is too short (< 8 characters)', () => {
      const shortPassword = 'Pass1!'; // 6 characters
      expect(() => password.make(shortPassword)).toThrow();
      expect(() => password.make(shortPassword)).toThrow();
    });

    it('should throw an AppError if the password is too short after trimming', () => {
      const shortPassword = '  Pass1!  '; // 6 chars after trim
      expect(() => password.make(shortPassword)).toThrow();
      expect(() => password.make(shortPassword)).toThrow();
    });

    it('should throw an AppError if the password is too long (> 128 characters)', () => {
      const longPassword = 'A1!'.repeat(43); // 129 characters
      expect(() => password.make(longPassword)).toThrow();
      expect(() => password.make(longPassword)).toThrow();
    });

    it('should throw an AppError if the password lacks an uppercase letter', () => {
      const missingUpper = 'password123!';
      expect(() => password.make(missingUpper)).toThrow();
      expect(() => password.make(missingUpper)).toThrow();
    });

    it('should throw an AppError if the password lacks a lowercase letter', () => {
      const missingLower = 'PASSWORD123!';
      expect(() => password.make(missingLower)).toThrow();
      expect(() => password.make(missingLower)).toThrow();
    });

    it('should throw an AppError if the password lacks a digit', () => {
      const missingDigit = 'PasswordTest!';
      expect(() => password.make(missingDigit)).toThrow();
      expect(() => password.make(missingDigit)).toThrow();
    });

    it('should throw an AppError if the password lacks a special character', () => {
      const missingSpecial = 'Password123';
      expect(() => password.make(missingSpecial)).toThrow();
      expect(() => password.make(missingSpecial)).toThrow();
    });

    it('should accept passwords with various valid special characters', () => {
      const validPasswords = [
        'Password123!',
        'Password123@',
        'Password123#',
        'Password123$',
        'Password123%',
        'Password123^',
        'Password123&',
        'Password123*',
        'Password123_',
        'Password123-',
        'Password123.',
        'Password123+',
        'Password123=',
        'Password123~',
      ];

      validPasswords.forEach((pwd) => {
        expect(password.make(pwd)).toBe(pwd);
      });
    });
  });
});
