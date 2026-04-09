import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import {
  ErrorInternalServerError,
  ErrorUnprocessableEntity,
  IApiValidationError,
} from '../../../shared/value-objects/error';

import { NODE_ENV } from '../../../infra/config/vars.config';
import ILogger from '../../../app/contracts/infra/logger.contract';
import IReporter from '../../../app/contracts/infra/reporter.contract';

export interface IApiError {
  message: string;
  validationErrors?: IApiValidationError[];
  cause?: any;
}

function httpErrorHandler(logger: ILogger, reporter: IReporter) {
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

    if (error.name === 'ApiError') {
      return res.status(error.code).json({
        message: error.message,
        validationErrors: error.validationErrors,
        cause: error.cause,
      });
    }

    const serverError = new ErrorInternalServerError(error.message);
    if (NODE_ENV !== 'local') {
      reporter.report(serverError);
    } else {
      logger.error('error', serverError);
    }

    return res.status(serverError.code).json({
      message: serverError.message,
      cause: serverError.cause,
    });
  };
}

export default httpErrorHandler;
