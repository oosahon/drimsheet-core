import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';

import ILogger from '@shared/contracts/logger.contract';
import IReporter from '@shared/contracts/reporter.contract';
import {
  EErrorKeyStatusSuffix,
  UErrorKeyStatusSuffix,
} from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';
import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import httpErrorParser from '@interface/http/helpers/http-error-parser';

const errorKeyStatusCode = {
  [EErrorKeyStatusSuffix.Invalid]: 400,
  [EErrorKeyStatusSuffix.Unauthorized]: 401,
  [EErrorKeyStatusSuffix.PaymentRequired]: 402,
  [EErrorKeyStatusSuffix.Forbidden]: 403,
  [EErrorKeyStatusSuffix.NotFound]: 404,
  [EErrorKeyStatusSuffix.Conflict]: 409,
  [EErrorKeyStatusSuffix.ValidationError]: 422,
  [EErrorKeyStatusSuffix.TooManyRequests]: 429,
  [EErrorKeyStatusSuffix.Unexpected]: 500,
} satisfies Record<UErrorKeyStatusSuffix, number>;

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
    delete req?.body?.token;

    req.files?.length &&
      // @ts-ignore
      req.files.forEach((file: any) => {
        delete file.buffer;
      });

    if (error instanceof ValidateError) {
      if (deps.nodeEnv === 'local') {
        deps.logger.error('http.request.validation_failed', {
          error,
          outcome: 'rejected',
        });
      }
      const validationErrors = httpErrorParser.parseTsoaValidationError(error);
      const errRes = new appError.UnprocessableEntity(validationErrors);

      return res
        .status(errorKeyStatusCode[EErrorKeyStatusSuffix.ValidationError])
        .json(httpErrorParser.toHttp(errRes, validationErrors));
    }

    const parsedError = errorUtils.parseError(error);
    const statusSuffix = parsedError.errorKeyStatusSuffix;

    if (
      !parsedError.errorKey ||
      !statusSuffix ||
      statusSuffix === EErrorKeyStatusSuffix.Unexpected
    ) {
      deps.reporter.report('http.request.failed', error);
      const serverError = new appError.InternalServerError();

      return res
        .status(errorKeyStatusCode[EErrorKeyStatusSuffix.Unexpected])
        .json(httpErrorParser.toHttp(serverError));
    }

    const statusCode = errorKeyStatusCode[statusSuffix];

    if (deps.nodeEnv === 'local') {
      deps.logger.error('http.request.rejected', {
        error,
        outcome: 'rejected',
      });
    }

    return res
      .status(statusCode)
      .json(httpErrorParser.fromParsedError(parsedError, parsedError.errorKey));
  };
}

export default makeHttpErrorHandler;
