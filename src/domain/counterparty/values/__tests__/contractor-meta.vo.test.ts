import addressValue from '@shared/values/contact-details/address.vo';

import contractorMetaValue from '@domain/counterparty/values/contractor-meta.vo';

const address = addressValue.make({
  line1: 'Main Street',
  city: 'Lagos',
  countryCode: 'NG',
});

describe('contractor metadata', () => {
  it('constructs deeply immutable address details without keeping a mutable alias', () => {
    const value = contractorMetaValue.make({ address });
    expect(value.address).toEqual(address);
    expect(value.address).not.toBe(address);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.address)).toBe(true);
  });
});
