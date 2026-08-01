import counterpartyError from '../../../../../domain/counterparty/errors/counterparty.error';
import addressError from '../../../../../shared/values/contact-details/address.error';
import { employerCreateReqValidation } from '../employer.dto.validation';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidCountryCodeKey = new addressError.InvalidCountryCode().errorKey;

describe('Employer DTO validation', () => {
  const validPayload = {
    name: 'MegaCorp Inc',
    status: 'active',
    type: 'organization',
    displayName: 'MegaCorp',
    address: {
      line1: '44 Broad Street',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  it('accepts a valid employer payload', () => {
    const result = employerCreateReqValidation.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual(validPayload);
  });

  it('accepts an employer payload without a display name', () => {
    const result = employerCreateReqValidation.safeParse({
      name: 'MegaCorp Inc',
      status: 'active',
      type: 'organization',
      address: validPayload.address,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data.displayName).toBeUndefined();
  });

  it('rejects an invalid display name', () => {
    const result = employerCreateReqValidation.safeParse({
      ...validPayload,
      displayName: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidNameKey);
    }
  });

  it('rejects an invalid address', () => {
    const result = employerCreateReqValidation.safeParse({
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
