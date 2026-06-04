import z from 'zod';
import appError from '../../app/shared/errors/app.error';
import { IApiValidationError } from '../types/error.types';

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
