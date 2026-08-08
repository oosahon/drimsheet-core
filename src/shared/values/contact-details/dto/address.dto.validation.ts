import z from 'zod';

import addressError from '@shared/values/contact-details/address.error';

const { InvalidLine1, InvalidCity, InvalidCountryCode } = addressError;

const invalidLine1Key = new InvalidLine1().errorKey;
const invalidCityKey = new InvalidCity().errorKey;
const invalidCountryCodeKey = new InvalidCountryCode().errorKey;

export const addressDtoValidation = z.object({
  line1: z
    .string(invalidLine1Key)
    .trim()
    .min(1, invalidLine1Key)
    .max(255, invalidLine1Key),
  line2: z.string().trim().max(255).optional(),
  city: z
    .string(invalidCityKey)
    .trim()
    .min(1, invalidCityKey)
    .max(100, invalidCityKey),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  countryCode: z
    .string(invalidCountryCodeKey)
    .trim()
    .length(2, invalidCountryCodeKey)
    .regex(/^[a-zA-Z]{2}$/, invalidCountryCodeKey)
    .transform((val) => val.toUpperCase()),
});
