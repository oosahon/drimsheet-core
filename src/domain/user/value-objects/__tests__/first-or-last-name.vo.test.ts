import { AppError } from '../../../../shared/value-objects/error';
import firstOrLastName from '../first-or-last-name.vo';

describe('FirstOrLastName Value Object', () => {
  describe('Valid names', () => {
    it('should accept standard English names', () => {
      expect(firstOrLastName.make('John')).toBe('John');
      expect(firstOrLastName.make('Doe')).toBe('Doe');
    });

    it('should accept single-character names', () => {
      expect(firstOrLastName.make('O')).toBe('O');
      expect(firstOrLastName.make('U')).toBe('U');
    });

    it('should accept names with hyphens and apostrophes', () => {
      expect(firstOrLastName.make('Anne-Marie')).toBe('Anne-Marie');
      expect(firstOrLastName.make("O'Connor")).toBe("O'Connor");
      expect(firstOrLastName.make("D'Artagnan-Smith")).toBe("D'Artagnan-Smith");
    });

    it('should accept names with accents and diacritics', () => {
      expect(firstOrLastName.make('José')).toBe('José');
      expect(firstOrLastName.make('Müller')).toBe('Müller');
      expect(firstOrLastName.make('Sørina')).toBe('Sørina');
      expect(firstOrLastName.make('François')).toBe('François');
      expect(firstOrLastName.make('Ångström')).toBe('Ångström');

      // Test unicode normalization: 'e' + combining acute accent vs 'é'
      const combined = '\u0065\u0301';
      const normalized = '\u00e9';
      expect(firstOrLastName.make(`Jos${combined}`)).toBe(`Jos${normalized}`);
    });

    it('should accept names in non-Latin scripts', () => {
      expect(firstOrLastName.make('Александр')).toBe('Александр'); // Cyrillic
      expect(firstOrLastName.make('محمد')).toBe('محمد'); // Arabic
      expect(firstOrLastName.make('佐藤')).toBe('佐藤'); // Kanji
      expect(firstOrLastName.make('가영')).toBe('가영'); // Hangul
    });

    it('should trim leading and trailing whitespace', () => {
      expect(firstOrLastName.make('  John  ')).toBe('John');
      expect(firstOrLastName.make('\nDoe\t')).toBe('Doe');
    });

    it('should collapse multiple internal spaces into a single space', () => {
      expect(firstOrLastName.make('Mary   Jane')).toBe('Mary Jane');
      expect(firstOrLastName.make('Mary\t\tJane')).toBe('Mary Jane');
    });
  });

  describe('Invalid names', () => {
    it('should throw an error for non-string inputs', () => {
      expect(() => firstOrLastName.make(null)).toThrow(
        new AppError('Name must be a string', { cause: null })
      );
      expect(() => firstOrLastName.make(123)).toThrow(
        new AppError('Name must be a string', { cause: 123 })
      );
      expect(() => firstOrLastName.make({})).toThrow(
        new AppError('Name must be a string', { cause: {} })
      );
      expect(() => firstOrLastName.make(undefined)).toThrow(
        new AppError('Name must be a string', { cause: undefined })
      );
    });

    it('should throw an error if the name is empty or only whitespace', () => {
      expect(() => firstOrLastName.make('')).toThrow(
        new AppError('Name is too short', { cause: '' })
      );
      expect(() => firstOrLastName.make('   ')).toThrow(
        new AppError('Name is too short', { cause: '   ' })
      );
    });

    it('should throw an error if the name is too long (> 128 characters)', () => {
      const veryLongName = 'A'.repeat(129);
      expect(() => firstOrLastName.make(veryLongName)).toThrow(
        new AppError('Name is too long', { cause: veryLongName })
      );
    });

    it('should throw an error if the name contains only structural valid characters but no actual letters', () => {
      expect(() => firstOrLastName.make('-')).toThrow(
        new AppError('Name is invalid', { cause: '-' })
      );
      expect(() => firstOrLastName.make("'")).toThrow(
        new AppError('Name is invalid', { cause: "'" })
      );
      expect(() => firstOrLastName.make("- '")).toThrow(
        new AppError('Name is invalid', { cause: "- '" })
      );
    });

    it('should throw an error if the name contains numbers', () => {
      expect(() => firstOrLastName.make('John123')).toThrow(
        new AppError('Name is invalid', { cause: 'John123' })
      );
      expect(() => firstOrLastName.make('123')).toThrow(
        new AppError('Name is invalid', { cause: '123' })
      );
    });

    it('should throw an error if the name contains invalid special characters', () => {
      expect(() => firstOrLastName.make('John@Doe')).toThrow(
        new AppError('Name is invalid', { cause: 'John@Doe' })
      );
      expect(() => firstOrLastName.make('John!Doe')).toThrow(
        new AppError('Name is invalid', { cause: 'John!Doe' })
      );
      expect(() => firstOrLastName.make('John#')).toThrow(
        new AppError('Name is invalid', { cause: 'John#' })
      );
      expect(() => firstOrLastName.make('John?')).toThrow(
        new AppError('Name is invalid', { cause: 'John?' })
      );
      expect(() => firstOrLastName.make('John_Doe')).toThrow(
        new AppError('Name is invalid', { cause: 'John_Doe' })
      );
    });
  });
});
