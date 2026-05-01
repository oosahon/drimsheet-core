import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import { IHttpErrorDto } from '../../../app/contracts/dto/error.dto';
import IReporter from '../../../app/contracts/infra/reporter.contract';
import httpError from '../../../app/errors/http.error';
import errorUtils from '../../../shared/utils/error';
import httpErrorParser from '../helpers/http-error-parser';

function makeHttpErrorHandler(reporter: IReporter) {
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
      const validationErrors = httpErrorParser.parseTsoaValidationError(error);
      const errRes = new httpError.UnprocessableEntity(validationErrors);

      return res
        .status(errRes.code)
        .json(httpErrorParser.toHttp(errRes, validationErrors));
    }

    const parsedError = errorUtils.parseError(error);

    const isUnknownError =
      parsedError.name === 'UnknownError' || parsedError.name === 'Error';

    if (isUnknownError) {
      reporter.report(error);
      const serverError = new httpError.InternalServerError();
      return res
        .status(serverError.code)
        .json(httpErrorParser.toHttp(serverError));
    }

    const isAuthError = parsedError.name === 'AuthError';

    const statusCode = isAuthError ? 401 : 400;

    return res
      .status(statusCode)
      .json(httpErrorParser.fromParsedError(parsedError));
  };
}

export default makeHttpErrorHandler;
