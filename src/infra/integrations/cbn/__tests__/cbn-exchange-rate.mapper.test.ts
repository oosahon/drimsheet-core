import { mapCbnExchangeRates } from '@infra/integrations/cbn/cbn-exchange-rate.mapper';
import { TCbnExchangeRateRecord } from '@infra/integrations/cbn/cbn-exchange-rate.schema';

describe('mapCbnExchangeRates', () => {
  const makeRecord = (
    overrides: Partial<TCbnExchangeRateRecord> = {}
  ): TCbnExchangeRateRecord => ({
    centralrate: '1500.25',
    currency: 'US DOLLAR',
    ratedate: '2026-06-04',
    ...overrides,
  });

  it.each([
    ['UAE DIRHAM', 'AED'],
    ['SWISS FRANC', 'CHF'],
    ['YUAN/RENMINBI', 'CNY'],
    ['DANISH KRONA', 'DKK'],
    ['DANISH KRONE', 'DKK'],
    ['DANISH KRONER', 'DKK'],
    ['EURO', 'EUR'],
    ['POUND STERLING', 'GBP'],
    ['POUNDS STERLING', 'GBP'],
    ['JAPANESE YEN', 'JPY'],
    ['YEN', 'JPY'],
    ['RIYAL', 'SAR'],
    ['US DOLLAR', 'USD'],
    ['CFA', 'XOF'],
    ['SOUTH AFRICAN RAND', 'ZAR'],
  ])('maps the confirmed CBN label %s to %s', (currency, expectedCode) => {
    const mapping = mapCbnExchangeRates([makeRecord({ currency })]);

    expect(mapping.exchangeRates[0]).toEqual({
      asOf: new Date('2026-06-04T00:00:00.000Z'),
      baseCurrencyCode: expectedCode,
      rate: 1500.25,
      source: 'CBN',
      targetCurrencyCode: 'NGN',
      type: 'official',
    });
  });

  it.each([
    ['AED', 'AED'],
    ['CHF', 'CHF'],
    ['CNY', 'CNY'],
    ['DKK', 'DKK'],
    ['EUR', 'EUR'],
    ['GBP', 'GBP'],
    ['JPY', 'JPY'],
    ['SAR', 'SAR'],
    ['USD', 'USD'],
    ['XOF', 'XOF'],
    ['ZAR', 'ZAR'],
  ])('accepts the provider code %s', (currency, expectedCode) => {
    const mapping = mapCbnExchangeRates([makeRecord({ currency })]);

    expect(mapping.exchangeRates[0].baseCurrencyCode).toBe(expectedCode);
  });

  it('normalizes whitespace and casing before mapping', () => {
    const mapping = mapCbnExchangeRates([
      makeRecord({ currency: '  us\t  dollar  ' }),
    ]);

    expect(mapping.exchangeRates[0].baseCurrencyCode).toBe('USD');
  });

  it('includes the initial cutoff date and excludes earlier observations', () => {
    const mapping = mapCbnExchangeRates([
      makeRecord({ ratedate: '2023-12-31' }),
      makeRecord({ ratedate: '2024-01-01' }),
    ]);

    expect(mapping.exchangeRates).toHaveLength(1);
    expect(mapping.exchangeRates[0].asOf).toEqual(
      new Date('2024-01-01T00:00:00.000Z')
    );
  });

  it('skips and deduplicates unsupported and NGN self-pair labels', () => {
    const mapping = mapCbnExchangeRates([
      makeRecord({ currency: 'SDR' }),
      makeRecord({ currency: ' sdr ' }),
      makeRecord({ currency: 'WAUA' }),
      makeRecord({ currency: 'NAIRA' }),
      makeRecord({ currency: 'POESO' }),
    ]);

    expect(mapping.exchangeRates).toEqual([]);
    expect(mapping.unsupportedCurrencyLabels).toEqual([
      'NAIRA',
      'POESO',
      'SDR',
      'WAUA',
    ]);
    expect(Object.isFrozen(mapping)).toBe(true);
  });
});
