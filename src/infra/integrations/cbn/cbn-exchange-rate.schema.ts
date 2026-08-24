import z from 'zod';

const positiveCentralRateSchema = z
  .string()
  .trim()
  .refine(
    (centralRate) => {
      const numericRate = Number(centralRate);

      return Number.isFinite(numericRate) && numericRate > 0;
    },
    { message: 'CBN central rate must be a positive numeric string' }
  );

export const cbnExchangeRateRecordSchema = z.object({
  currency: z.string().trim().min(1),
  ratedate: z.iso.date(),
  centralrate: positiveCentralRateSchema,
});

export const cbnExchangeRatesSchema = z
  .array(cbnExchangeRateRecordSchema)
  .min(1, 'CBN exchange-rate response must not be empty');

export type TCbnExchangeRateRecord = z.infer<
  typeof cbnExchangeRateRecordSchema
>;
