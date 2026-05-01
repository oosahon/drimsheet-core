import { ValidateError } from 'tsoa';
import { IHttpErrorDto } from '../../../app/contracts/dto/error.dto';
import httpError from '../../../app/errors/http.error';
import {
  IApiValidationError,
  IParsedError,
} from '../../../shared/types/error.types';

function parseTsoaValidationError(error: ValidateError) {
  return Object.entries(error.fields).map(([key, value]) => ({
    field: key,
    message: value.message,
  }));
}

function toHttp(
  error: InstanceType<typeof httpError.Base>,
  validationErrors?: IApiValidationError[]
): IHttpErrorDto {
  return {
    name: error.name,
    errorKey: error.errorKey,
    cause: error.cause,
    validationErrors,
  };
}

function fromParsedError(error: IParsedError): IHttpErrorDto {
  return {
    name: error.name,
    errorKey: error.errorKey,
    cause: error.cause,
  };
}

const httpErrorParser = Object.freeze({
  parseTsoaValidationError,
  toHttp,
  fromParsedError,
});

export default httpErrorParser;
