export type TErrorCause = Record<string, unknown>;

export const EErrorKeyStatusSuffix = Object.freeze({
  Invalid: 'invalid',
  Unauthorized: 'unauthorized',
  PaymentRequired: 'payment_required',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  Conflict: 'conflict',
  ValidationError: 'validation_error',
  TooManyRequests: 'too_many_requests',
  Unexpected: 'unexpected',
});

export type UErrorKeyStatusSuffix =
  (typeof EErrorKeyStatusSuffix)[keyof typeof EErrorKeyStatusSuffix];

export type TErrorKey<TContext extends string = string> =
  | `${TContext}_${UErrorKeyStatusSuffix}`
  | `${TContext}_${string}_${UErrorKeyStatusSuffix}`;

export interface IApiValidationError {
  field: string;
  message: string;
}

export type TErrorKeys<TContext extends string> = Readonly<
  Record<string, TErrorKey<TContext>>
>;

export type TErrorConstructor<T extends Error = Error> = new (
  cause?: TErrorCause
) => T;

export interface IParsedError {
  name: string;
  errorKey?: TErrorKey;
  errorKeyStatusSuffix?: UErrorKeyStatusSuffix;
  cause?: TErrorCause;
  validationErrors?: IApiValidationError[];
  _raw: unknown;
}
