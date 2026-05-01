export type TErrorCause = Record<string, unknown>;

export interface IApiValidationError {
  field: string;
  message: string;
}
