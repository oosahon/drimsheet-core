import { ValidateError } from 'tsoa';
import {
  IApiValidationError,
  IParsedError,
} from '../../../shared/types/error.types';
import appError from '../../../shared/values/errors/app.error';
import { IHttpErrorDto } from '../../../shared/values/errors/error.dto';

function parseTsoaValidationError(error: ValidateError) {
  return Object.entries(error.fields).map(([key, value]) => ({
    field: key,
    message: value.message,
  }));
}

function toHttp(
  error: InstanceType<typeof appError.Base>,
  validationErrors?: IApiValidationError[]
): IHttpErrorDto {
  return {
    name: error.name,
    errorKey: error.errorKey as string, // Cast to string since UAppError might not perfectly match HTTP expected keys without cast depending on types, or just let it map. Actually IParsedError handles it.
    cause: error.cause,
    validationErrors,
  };
}

function fromParsedError(error: IParsedError): IHttpErrorDto {
  return {
    name: error.name,
    errorKey: error.errorKey,
    cause: error.cause,
    validationErrors: error.validationErrors,
  };
}

const httpErrorParser = Object.freeze({
  parseTsoaValidationError,
  toHttp,
  fromParsedError,
});

export default httpErrorParser;
