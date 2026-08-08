import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import creditCardMetaValue from '@domain/ledger/values/credit-card-meta.vo';

describe('creditCardMetaValue', () => {
  const validPayload = {
    cardIssuer: 'Visa',
    lastFourDigits: '4242',
    lastReconciliationDate: new Date('2026-03-01T00:00:00.000Z'),
  };

  it('creates normalized frozen credit-card metadata', () => {
    const meta = creditCardMetaValue.make({
      ...validPayload,
      cardIssuer: '  Visa  ',
      lastFourDigits: ' 4242 ',
    });

    expect(meta).toEqual({
      cardIssuer: 'Visa',
      lastFourDigits: '4242',
      lastReconciliationDate: null,
    });
    expect(Object.isFrozen(meta)).toBe(true);
  });

  it.each(['A', 'A'.repeat(101)])(
    'rejects an issuer outside the allowed length: %s',
    (cardIssuer) => {
      expect(() =>
        creditCardMetaValue.make({ ...validPayload, cardIssuer })
      ).toThrow(ledgerAccountError.InvalidCardIssuer);
    }
  );

  it.each(['123', '12345'])(
    'rejects card digits outside the required length: %s',
    (lastFourDigits) => {
      expect(() =>
        creditCardMetaValue.make({ ...validPayload, lastFourDigits })
      ).toThrow(ledgerAccountError.InvalidLastFourDigits);
    }
  );
});
