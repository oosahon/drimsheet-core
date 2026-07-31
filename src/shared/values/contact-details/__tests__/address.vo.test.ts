import addressError from '../address.error';
import addressValue from '../address.vo';

describe('addressValue', () => {
  const validPayload = {
    line1: '123 Commercial Way',
    line2: 'Suite 400',
    city: 'Lagos',
    region: 'Lagos State',
    postalCode: '100001',
    countryCode: 'NG',
  };

  describe('make', () => {
    it('creates a frozen address value object with valid payload', () => {
      const result = addressValue.make(validPayload);

      expect(result).toEqual({
        line1: '123 Commercial Way',
        line2: 'Suite 400',
        city: 'Lagos',
        region: 'Lagos State',
        postalCode: '100001',
        countryCode: 'NG',
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('trims whitespace and normalizes country code to uppercase', () => {
      const result = addressValue.make({
        line1: '  123 Commercial Way  ',
        line2: '  Suite 400  ',
        city: '  Lagos  ',
        region: '  Lagos State  ',
        postalCode: '  100001  ',
        countryCode: ' ng ',
      });

      expect(result).toEqual({
        line1: '123 Commercial Way',
        line2: 'Suite 400',
        city: 'Lagos',
        region: 'Lagos State',
        postalCode: '100001',
        countryCode: 'NG',
      });
    });

    it('handles optional fields as null when omitted or whitespace', () => {
      const result = addressValue.make({
        line1: '123 Commercial Way',
        city: 'Lagos',
        countryCode: 'NG',
        line2: '   ',
        region: null,
      });

      expect(result).toEqual({
        line1: '123 Commercial Way',
        line2: null,
        city: 'Lagos',
        region: null,
        postalCode: null,
        countryCode: 'NG',
      });
    });

    it('throws InvalidAddress when payload is null or not an object', () => {
      expect(() => addressValue.make(null as any)).toThrow(
        addressError.InvalidAddress
      );
      expect(() => addressValue.make(undefined as any)).toThrow(
        addressError.InvalidAddress
      );
    });

    it('throws InvalidLine1 when line1 is empty or whitespace', () => {
      expect(() => addressValue.make({ ...validPayload, line1: '' })).toThrow(
        addressError.InvalidLine1
      );
      expect(() =>
        addressValue.make({ ...validPayload, line1: '   ' })
      ).toThrow(addressError.InvalidLine1);
      expect(() =>
        addressValue.make({ ...validPayload, line1: 123 as any })
      ).toThrow(addressError.InvalidLine1);
    });

    it('throws InvalidCity when city is empty or whitespace', () => {
      expect(() => addressValue.make({ ...validPayload, city: '' })).toThrow(
        addressError.InvalidCity
      );
      expect(() => addressValue.make({ ...validPayload, city: '   ' })).toThrow(
        addressError.InvalidCity
      );
    });

    it('throws InvalidCountryCode for invalid country codes', () => {
      expect(() =>
        addressValue.make({ ...validPayload, countryCode: '' })
      ).toThrow(addressError.InvalidCountryCode);
      expect(() =>
        addressValue.make({ ...validPayload, countryCode: 'NGA' })
      ).toThrow(addressError.InvalidCountryCode);
      expect(() =>
        addressValue.make({ ...validPayload, countryCode: '12' })
      ).toThrow(addressError.InvalidCountryCode);
    });
  });

  describe('validate', () => {
    it('passes for valid address', () => {
      const address = addressValue.make(validPayload);
      expect(() => addressValue.validate(address)).not.toThrow();
    });

    it('throws InvalidAddress when address is null', () => {
      expect(() => addressValue.validate(null as any)).toThrow(
        addressError.InvalidAddress
      );
    });

    it('throws when line1 is invalid', () => {
      expect(() =>
        addressValue.validate({ ...validPayload, line1: '' })
      ).toThrow(addressError.InvalidLine1);
    });
  });
});
