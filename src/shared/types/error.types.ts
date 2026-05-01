export type TErrorCause = Record<string, unknown>;

export interface IApiValidationError {
  field: string;
  message: string;
}

export type TErrorKeys<K> = Readonly<Record<string, K>>;
