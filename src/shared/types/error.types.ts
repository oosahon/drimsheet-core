export type TErrorCause = Record<string, unknown>;

export interface IApiValidationError {
  field: string;
  message: string;
}

export type TErrorKeys<K> = Readonly<Record<string, K>>;

export type TErrorConstructor<T extends Error = Error> = new (
  cause?: TErrorCause
) => T;

export interface IParsedError {
  name: string;
  errorKey: string;
  cause?: TErrorCause;
  validationErrors?: IApiValidationError[];
  _raw: unknown;
}
