import z from 'zod';

import { jurisdictionCodeValidation } from '@app/accounting/dtos/accounting/accounting.dto.validation';

export const getBanksQueryValidationSchema = z.object({
  countryCode: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    jurisdictionCodeValidation
  ),
});
