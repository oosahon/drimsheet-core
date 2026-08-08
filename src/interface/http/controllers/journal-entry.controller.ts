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

import { IReceiptEntryReq } from '@app/journal-entry/dtos/receipt-entry/receipt-entry.dto';

import { createReceiptUseCase } from '@infra/ioc/usecases/journal-entry';

import middlewares from '@interface/http/middlewares';

@Route('journal-entries')
@Tags('Journal Entry')
export class JournalEntryController extends Controller {
  /**
   * Create receipt journal entry
   */
  @Post('/receipt')
  @OperationId('createReceipt')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createReceipt(@Body() body: IReceiptEntryReq) {
    return createReceiptUseCase(body);
  }
}
