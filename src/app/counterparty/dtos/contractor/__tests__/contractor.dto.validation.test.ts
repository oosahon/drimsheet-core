import counterpartyError from '../../../../../domain/counterparty/errors/counterparty.error';
import addressError from '../../../../../shared/values/contact-details/address.error';
import { contractorCreateReqValidation } from '../contractor.dto.validation';

const invalidNameKey = new counterpartyError.InvalidName().errorKey;
const invalidCountryCodeKey = new addressError.InvalidCountryCode().errorKey;

describe('Contractor DTO validation', () => {
  const validPayload = {
    name: 'Ada Builder',
    status: 'active',
    type: 'individual',
    address: {
      line1: '7 Marina Road',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  it('accepts a valid contractor payload', () => {
    const result = contractorCreateReqValidation.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual(validPayload);
  });

  it('rejects a missing address', () => {
    const result = contractorCreateReqValidation.safeParse({
      name: 'Ada Builder',
      status: 'active',
      type: 'individual',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid counterparty name', () => {
    const result = contractorCreateReqValidation.safeParse({
      ...validPayload,
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidNameKey);
    }
  });

  it('rejects an invalid address', () => {
    const result = contractorCreateReqValidation.safeParse({
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
