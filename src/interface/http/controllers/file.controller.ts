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

import {
  IFileUploadDto,
  IFileUploadReq,
} from '@app/file/dtos/file-upload/file-upload.dto';

import middlewares from '@infra/ioc/middlewares/http';
import { preSignUploadsUseCase } from '@infra/ioc/usecases/file';

@Route('files')
@Tags('File')
export class FileController extends Controller {
  /**
   * Pre-sign direct-to-Blackblaze upload instructions
   */
  @Post('/upload')
  @OperationId('preSignUploads')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async preSignUploads(
    @Body() body: IFileUploadReq[]
  ): Promise<IFileUploadDto[]> {
    return await preSignUploadsUseCase(body);
  }
}
