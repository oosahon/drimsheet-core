import { AppError } from '../../../../shared/value-objects/error';
import email from '../email.vo';

describe('Email Value Object', () => {
  describe('isValid', () => {
    it('should return true for valid simple emails', () => {
      expect(email.isValid('test@example.com')).toBe(true);
      expect(email.isValid('user.name+tag+sorting@example.com')).toBe(true);
      expect(email.isValid('x@example.com')).toBe(true);
      expect(email.isValid('example-indeed@strange-example.com')).toBe(true);
      expect(email.isValid('admin@mailserver1')).toBe(false); // domain needs at least one dot per new rules
      expect(email.isValid('example@s.example')).toBe(true);
    });

    it('should return true for valid emails with special characters', () => {
      expect(email.isValid("o'connor@example.com")).toBe(true);
      expect(email.isValid('sales&marketing@example.com')).toBe(true);
      expect(email.isValid('name/with/slashes@example.com')).toBe(true);
      expect(email.isValid("!#$%&'*+-/=?^_`{}|~@example.org")).toBe(true);
    });

    it('should return false for non-string inputs', () => {
      // @ts-expect-error Testing invalid runtime input
      expect(email.isValid(null)).toBe(false);
      // @ts-expect-error Testing invalid runtime input
      expect(email.isValid(123)).toBe(false);
      // @ts-expect-error Testing invalid runtime input
      expect(email.isValid({})).toBe(false);
      // @ts-expect-error Testing invalid runtime input
      expect(email.isValid(undefined)).toBe(false);
    });

    it('should return false for missing parts', () => {
      expect(email.isValid('plainaddress')).toBe(false);
      expect(email.isValid('@missinglocal.org')).toBe(false);
      expect(email.isValid('missingdomain@')).toBe(false);
      expect(email.isValid('@')).toBe(false);
      expect(email.isValid('')).toBe(false);
    });

    it('should return false for invalid dot placement in local part', () => {
      expect(email.isValid('.local@example.com')).toBe(false);
      expect(email.isValid('local.@example.com')).toBe(false);
      expect(email.isValid('local..part@example.com')).toBe(false);
    });

    it('should return false for invalid formatting', () => {
      expect(email.isValid('two@@symbols.com')).toBe(false);
      expect(email.isValid('spaces in local@example.com')).toBe(false);
      expect(email.isValid('user@spaces in domain.com')).toBe(false);
      expect(email.isValid('user@[192.168.1.1]')).toBe(false); // IP brackets not supported in our simple regex
    });

    it('should return false for length violations', () => {
      // Local part > 64 chars
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(email.isValid(longLocal)).toBe(false);

      // Total length > 254 chars
      const longDomainLabel = 'a'.repeat(61);
      const longEmail = `test@${longDomainLabel}.${longDomainLabel}.${longDomainLabel}.${longDomainLabel}.com`;
      expect(longEmail.length).toBeGreaterThan(254);
      expect(email.isValid(longEmail)).toBe(false);
    });

    it('should return false for invalid domain labels', () => {
      // Domain label > 63 chars
      const invalidLabel = 'a'.repeat(64);
      expect(email.isValid(`test@${invalidLabel}.com`)).toBe(false);

      expect(email.isValid('test@-example.com')).toBe(false);
      expect(email.isValid('test@example-.com')).toBe(false);
    });
  });

  describe('normalize', () => {
    it('should lowercase and trim the email', () => {
      expect(email.normalize('  Test@EXAMPLE.com  ')).toBe('test@example.com');
      expect(email.normalize('UPPER@CASE.ORG')).toBe('upper@case.org');
    });
  });

  describe('make', () => {
    it('should create normalized email if valid', () => {
      expect(email.make('  Valid@Example.Com  ')).toBe('valid@example.com');
    });

    it('should throw AppError if invalid', () => {
      expect(() => email.make('invalid-email')).toThrow(AppError);
      expect(() => email.make('invalid-email')).toThrow(
        'Invalid email address'
      );
    });

    it('should throw AppError if not a string', () => {
      // @ts-expect-error Testing invalid runtime input
      expect(() => email.make(null)).toThrow(AppError);
    });
  });

  describe('localPart and domain getters', () => {
    it('should extract local part safely', () => {
      expect(email.localPart('test@example.com')).toBe('test');
      expect(email.localPart("o'connor@example.com")).toBe("o'connor");
      expect(email.localPart('invalid.email')).toBe('invalid.email'); // Graceful degradation
      expect(email.localPart('@nodomain.com')).toBe('');
    });

    it('should extract domain safely', () => {
      expect(email.domain('test@example.com')).toBe('example.com');
      expect(email.domain("o'connor@example.com")).toBe('example.com');
      expect(email.domain('invalid.email')).toBe(''); // Graceful degradation
      expect(email.domain('nodomain@')).toBe('');
    });
  });
});
