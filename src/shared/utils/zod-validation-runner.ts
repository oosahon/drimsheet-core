import z from 'zod';
import { IApiValidationError } from '../types/error.types';
import appError from '../values/errors/app.error';

function errorFormatter(errors: z.core.$ZodIssue[]): IApiValidationError[] {
  return errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export default function zodValidationRunner(
  schema: z.ZodSchema<unknown>,
  payload: unknown
) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const validationErrors = errorFormatter(result.error.issues);
    throw new appError.UnprocessableEntity(validationErrors);
  }
}
