import counterpartyError from '../../../../../domain/counterparty/errors/counterparty.error';
import addressError from '../../../../../shared/values/contact-details/address.error';
import { vendorCreateReqValidation } from '../vendor.dto.validation';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidCountryCodeKey = new addressError.InvalidCountryCode().errorKey;

describe('Vendor DTO validation', () => {
  const validPayload = {
    name: 'Acme Supplies',
    status: 'active',
    type: 'organization',
    address: {
      line1: '12 Market Street',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  it('accepts a valid vendor payload with an address', () => {
    const result = vendorCreateReqValidation.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual(validPayload);
  });

  it('accepts a valid vendor payload without an address', () => {
    const result = vendorCreateReqValidation.safeParse({
      name: 'Acme Supplies',
      status: 'active',
      type: 'organization',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data.address).toBeUndefined();
  });

  it('rejects an invalid counterparty name', () => {
    const result = vendorCreateReqValidation.safeParse({
      ...validPayload,
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidNameKey);
    }
  });

  it('rejects an invalid address', () => {
    const result = vendorCreateReqValidation.safeParse({
      ...validPayload,
      address: {
        ...validPayload.address,
        countryCode: 'NGA',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidCountryCodeKey);
    }
  });
});
