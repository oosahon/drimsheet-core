import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import httpError from '../../../app/errors/http.error';
import { IApiValidationError } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

export interface IApiError {
  message: string;
  validationErrors?: IApiValidationError[];
  cause?: any;
}

function makeHttpErrorHandler(reporter: IReporter) {
  return (req: Request, res: Response<IApiError>, error: any) => {
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
      const validationErrors = Object.entries(error.fields).map(
        ([key, value]) => ({
          field: key,
          message: value.message,
        })
      );
      const { code, name, ...body } = new httpError.UnprocessableEntity(
        validationErrors
      );

      return res.status(code).json(body);
    }

    const { type, ...parsedError } = errorUtils.parseError(error);

    const isKnownError = type === 'api' || type === 'domain';

    if (isKnownError) {
      const isAuthError =
        'errorKey' in parsedError &&
        typeof parsedError.errorKey === 'string' &&
        parsedError.errorKey.startsWith('app_error_auth_');

      const defaultCode = isAuthError ? 401 : 400;
      const rawError = parsedError._raw as any;
      const code = rawError?.code || defaultCode;

      const body = {
        name: parsedError.name,
        errorKey: parsedError.errorKey,
        message: parsedError.errorKey || 'Unknown error',
        cause: parsedError.cause,
      };

      return res.status(code as number).json(body);
    }

    reporter.report(error);
    const serverError = new httpError.InternalServerError();
    return res.status(serverError.code).json({
      message: serverError.message,
    });
  };
}

export default makeHttpErrorHandler;
