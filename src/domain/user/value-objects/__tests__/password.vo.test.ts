import password from '../password.vo';
import { AppError } from '../../../../shared/value-objects/error';

describe('Password Value Object', () => {
  describe('make()', () => {
    it('should create a valid password', () => {
      const validPassword = 'StrongPassword1!';
      expect(password.make(validPassword)).toBe(validPassword);
    });

    it('should trim surrounding whitespace from a valid password', () => {
      const validPassword = '  StrongPassword1!  ';
      expect(password.make(validPassword)).toBe('StrongPassword1!');
    });

    it('should throw an AppError if the input is not a string', () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      invalidInputs.forEach((input) => {
        expect(() => password.make(input as any)).toThrow(AppError);
        expect(() => password.make(input as any)).toThrow(
          'Password must be a string'
        );
      });
    });

    it('should throw an AppError if the password is too short (< 8 characters)', () => {
      const shortPassword = 'Pass1!'; // 6 characters
      expect(() => password.make(shortPassword)).toThrow(AppError);
      expect(() => password.make(shortPassword)).toThrow(
        'Password is too short'
      );
    });

    it('should throw an AppError if the password is too short after trimming', () => {
      const shortPassword = '  Pass1!  '; // 6 chars after trim
      expect(() => password.make(shortPassword)).toThrow(AppError);
      expect(() => password.make(shortPassword)).toThrow(
        'Password is too short'
      );
    });

    it('should throw an AppError if the password is too long (> 128 characters)', () => {
      const longPassword = 'A1!'.repeat(43); // 129 characters
      expect(() => password.make(longPassword)).toThrow(AppError);
      expect(() => password.make(longPassword)).toThrow('Password is too long');
    });

    it('should throw an AppError if the password lacks an uppercase letter', () => {
      const missingUpper = 'password123!';
      expect(() => password.make(missingUpper)).toThrow(AppError);
      expect(() => password.make(missingUpper)).toThrow('Password is too easy');
    });

    it('should throw an AppError if the password lacks a lowercase letter', () => {
      const missingLower = 'PASSWORD123!';
      expect(() => password.make(missingLower)).toThrow(AppError);
      expect(() => password.make(missingLower)).toThrow('Password is too easy');
    });

    it('should throw an AppError if the password lacks a digit', () => {
      const missingDigit = 'PasswordTest!';
      expect(() => password.make(missingDigit)).toThrow(AppError);
      expect(() => password.make(missingDigit)).toThrow('Password is too easy');
    });

    it('should throw an AppError if the password lacks a special character', () => {
      const missingSpecial = 'Password123';
      expect(() => password.make(missingSpecial)).toThrow(AppError);
      expect(() => password.make(missingSpecial)).toThrow(
        'Password is too easy'
      );
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
