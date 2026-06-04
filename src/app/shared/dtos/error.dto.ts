import {
  IApiValidationError,
  TErrorCause,
} from '../../../shared/types/error.types';

export interface IHttpErrorDto {
  name: string;
  errorKey: string;
  validationErrors?: IApiValidationError[];
  cause?: TErrorCause;
}
