import addressError from '@shared/values/contact-details/address.error';
import { addressDtoValidation } from '@shared/values/contact-details/dto/address.dto.validation';

const { InvalidLine1, InvalidCity, InvalidCountryCode } = addressError;

const invalidLine1Key = new InvalidLine1().errorKey;
const invalidCityKey = new InvalidCity().errorKey;
const invalidCountryCodeKey = new InvalidCountryCode().errorKey;

describe('addressDtoValidation', () => {
  const validPayload = {
    line1: '123 Commercial Way',
    line2: 'Suite 400',
    city: 'Lagos',
    region: 'Lagos State',
    postalCode: '100001',
    countryCode: 'NG',
  };

  it('accepts a valid payload', () => {
    const result = addressDtoValidation.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual(validPayload);
  });

  it('normalizes country code to uppercase and trims whitespaces', () => {
    const result = addressDtoValidation.safeParse({
      line1: '  123 Commercial Way  ',
      line2: '  Suite 400  ',
      city: '  Lagos  ',
      region: '  Lagos State  ',
      postalCode: '  100001  ',
      countryCode: ' ng ',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual({
      line1: '123 Commercial Way',
      line2: 'Suite 400',
      city: 'Lagos',
      region: 'Lagos State',
      postalCode: '100001',
      countryCode: 'NG',
    });
  });

  it('handles optional fields when omitted', () => {
    const result = addressDtoValidation.safeParse({
      line1: '123 Commercial Way',
      city: 'Lagos',
      countryCode: 'NG',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(result.data).toEqual({
      line1: '123 Commercial Way',
      city: 'Lagos',
      countryCode: 'NG',
    });
  });

  it('rejects empty or whitespace-only line1', () => {
    const result1 = addressDtoValidation.safeParse({
      ...validPayload,
      line1: '',
    });
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error.issues[0].message).toBe(invalidLine1Key);
    }

    const result2 = addressDtoValidation.safeParse({
      ...validPayload,
      line1: '   ',
    });
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error.issues[0].message).toBe(invalidLine1Key);
    }
  });

  it('rejects line1 that exceeds 255 characters', () => {
    const result = addressDtoValidation.safeParse({
      ...validPayload,
      line1: 'a'.repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidLine1Key);
    }
  });

  it('rejects empty or whitespace-only city', () => {
    const result = addressDtoValidation.safeParse({
      ...validPayload,
      city: '   ',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidCityKey);
    }
  });

  it('rejects city that exceeds 100 characters', () => {
    const result = addressDtoValidation.safeParse({
      ...validPayload,
      city: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(invalidCityKey);
    }
  });

  it('rejects invalid country codes', () => {
    const invalidCodes = ['', ' ', 'N', 'NGN', '12', 'N1'];
    for (const code of invalidCodes) {
      const result = addressDtoValidation.safeParse({
        ...validPayload,
        countryCode: code,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(invalidCountryCodeKey);
      }
    }
  });
});
