import addressValue from '@shared/values/contact-details/address.vo';

import vendorMetaValue from '@domain/counterparty/values/vendor-meta.vo';

const address = addressValue.make({
  line1: 'Main Street',
  city: 'Lagos',
  countryCode: 'NG',
});

describe('vendor metadata', () => {
  it('constructs deeply immutable address details without keeping a mutable alias', () => {
    const value = vendorMetaValue.make({ address });
    expect(value.address).toEqual(address);
    expect(value.address).not.toBe(address);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.address)).toBe(true);
  });
  it('retains a null address', () => {
    expect(vendorMetaValue.make({ address: null })).toEqual({ address: null });
  });
});

it('normalizes an omitted address to null', () => {
  expect(vendorMetaValue.make({})).toEqual({ address: null });
});

it('checks optional address lengths after normalizing raw input', () => {
  expect(() =>
    vendorMetaValue.make({
      address: {
        line1: 'Street',
        city: 'Lagos',
        countryCode: 'ng',
        line2: 'x'.repeat(256),
      },
    })
  ).toThrow();
});
