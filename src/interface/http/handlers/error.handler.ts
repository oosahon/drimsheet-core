import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import {
  ErrorInternalServerError,
  ErrorUnprocessableEntity,
  IApiValidationError,
  parseError,
} from '../../../shared/value-objects/error';
import IReporter from '../../../app/contracts/infra/reporter.contract';

export interface IApiError {
  message: string;
  validationErrors?: IApiValidationError[];
  cause?: any;
}

function httpErrorHandler(reporter: IReporter) {
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
      const { code, name, ...body } = new ErrorUnprocessableEntity(
        validationErrors
      );

      return res.status(code).json(body);
    }

    const { type, ...parsedError } = parseError(error);

    const isKnownError = type === 'api' || type === 'domain';

    if (isKnownError) {
      const { code = 400, ...body } = parsedError;

      return res.status(code).json(body);
    }

    reporter.report(error);
    const serverError = new ErrorInternalServerError(error.message);
    return res.status(serverError.code).json({
      message: serverError.message,
    });
  };
}

export default httpErrorHandler;
