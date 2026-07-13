import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import ILogger from '../../../shared/contracts/logger.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import appError from '../../../shared/errors/app.error';
import { IHttpErrorDto } from '../../../shared/errors/error.dto';
import errorUtils from '../../../shared/utils/error';
import httpErrorParser from '../helpers/http-error-parser';

const errorKeyToStatusCode: Record<string, number> = {
  app_error_invalid_value: 400,
  app_error_bad_request: 400,
  app_error_unauthorized: 401,
  app_error_payment_required: 402,
  app_error_forbidden: 403,
  app_error_resource_not_found: 404,
  app_error_conflict: 409,
  app_error_unprocessable: 422,
  app_error_too_many_requests: 429,
  app_error_internal_server_error: 500,
};

function getStatusCodeFromError(error: any): number {
  if (error.name === 'AuthError') return 401;
  if (error.errorKey && errorKeyToStatusCode[error.errorKey]) {
    return errorKeyToStatusCode[error.errorKey];
  }
  return 400; // default for domain errors and others
}

interface IDependencies {
  reporter: IReporter;
  logger: ILogger;
  nodeEnv: string;
}

function makeHttpErrorHandler(deps: IDependencies) {
  return (req: Request, res: Response<IHttpErrorDto>, error: unknown) => {
    delete req?.headers.authorization;
    // @ts-ignore
    delete req?.file?.buffer;
    delete req?.body?.password;

    req.files?.length &&
      // @ts-ignore
      req.files.forEach((file: any) => {
        delete file.buffer;
      });

    if (error instanceof ValidateError) {
      if (deps.nodeEnv === 'local') deps.logger.error(error);
      const validationErrors = httpErrorParser.parseTsoaValidationError(error);
      const errRes = new appError.UnprocessableEntity(validationErrors);

      return res
        .status(errorKeyToStatusCode[errRes.errorKey] as number)
        .json(httpErrorParser.toHttp(errRes, validationErrors));
    }

    const parsedError = errorUtils.parseError(error);

    const isUnknownError =
      parsedError.name === 'UnknownError' || parsedError.name === 'Error';

    if (isUnknownError) {
      deps.reporter.report(error);
      const serverError = new appError.InternalServerError();
      return res
        .status(errorKeyToStatusCode[serverError.errorKey] as number)
        .json(httpErrorParser.toHttp(serverError));
    }

    if (deps.nodeEnv === 'local') deps.logger.error(error);

    const statusCode = getStatusCodeFromError(parsedError);

    return res
      .status(statusCode)
      .json(httpErrorParser.fromParsedError(parsedError));
  };
}

export default makeHttpErrorHandler;
