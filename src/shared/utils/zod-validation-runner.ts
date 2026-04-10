import z from 'zod';
import {
  ErrorUnprocessableEntity,
  IApiValidationError,
} from '../value-objects/error';

function errorFormatter(errors: z.core.$ZodIssue[]): IApiValidationError[] {
  return errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export default function zodValidationRunner(
  schema: z.ZodSchema<any>,
  payload: any
) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const validationErrors = errorFormatter(result.error.issues);
    throw new ErrorUnprocessableEntity(validationErrors);
  }
}
