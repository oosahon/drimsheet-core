import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import { IFileUploadReq } from '@app/file/dtos/file-upload/file-upload.dto';

import middlewares from '@infra/ioc/middlewares/http';
import { createFileUploadUseCase } from '@infra/ioc/usecases/file';

@Route('files')
@Tags('File')
export class FileController extends Controller {
  /**
   * Create a direct-to-Blackblaze file upload instruction
   */
  @Post('/upload')
  @OperationId('createFileUpload')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async createFileUpload(@Body() body: IFileUploadReq) {
    return await createFileUploadUseCase(body);
  }
}
