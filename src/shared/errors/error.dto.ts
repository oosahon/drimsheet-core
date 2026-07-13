import { IApiValidationError, TErrorCause } from '../types/error.types';

export interface IHttpErrorDto {
  name: string;
  errorKey: string;
  validationErrors?: IApiValidationError[];
  cause?: TErrorCause;
}
