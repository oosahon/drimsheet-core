import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import counterpartyValidation from '@domain/counterparty/values/validations/counterparty.validation';

describe('Counterparty display-name normalization', () => {
  describe('sanitizeDisplayName', () => {
    it('sanitizes and returns a non-empty display name', () => {
      expect(counterpartyValidation.sanitizeDisplayName('  Acme Corp  ')).toBe(
        'Acme Corp'
      );
    });

    it.each([undefined, null, '', '   '])(
      'returns null for empty display name %p',
      (displayName) => {
        expect(
          counterpartyValidation.sanitizeDisplayName(displayName)
        ).toBeNull();
      }
    );

    it('throws InvalidName for a display name that is too long', () => {
      const displayName = 'a'.repeat(256);

      expect(() =>
        counterpartyValidation.sanitizeDisplayName(displayName)
      ).toThrow(counterpartyError.InvalidName);
    });
  });
});
