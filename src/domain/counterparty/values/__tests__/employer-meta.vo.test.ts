import addressValue from '@shared/values/contact-details/address.vo';

import employerMetaValue from '@domain/counterparty/values/employer-meta.vo';

const address = addressValue.make({
  line1: 'Main Street',
  city: 'Lagos',
  countryCode: 'NG',
});

describe('employer metadata', () => {
  it('constructs deeply immutable address details without keeping a mutable alias', () => {
    const value = employerMetaValue.make({
      address,
      displayName: ' Employer ',
    });
    expect(value.address).toEqual(address);
    expect(value.address).not.toBe(address);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.address)).toBe(true);
    expect(value.displayName).toBe('Employer');
  });
  it.each([null, '', '   '])(
    'normalizes an absent display name %j',
    (displayName) => {
      expect(
        employerMetaValue.make({ address, displayName }).displayName
      ).toBeNull();
    }
  );
});

it('validates display-name length after trimming, preserving existing normalization', () => {
  expect(
    employerMetaValue.make({
      address,
      displayName: ' '.repeat(256) + 'Employer',
    }).displayName
  ).toBe('Employer');
});

it('constructs a canonical address and display name from raw optional inputs', () => {
  expect(
    employerMetaValue.make({
      address: { line1: ' Street ', city: ' Lagos ', countryCode: 'ng' },
    })
  ).toEqual({
    displayName: null,
    address: {
      line1: 'Street',
      line2: null,
      city: 'Lagos',
      region: null,
      postalCode: null,
      countryCode: 'NG',
    },
  });
});
