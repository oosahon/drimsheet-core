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
import { ITransferTransactionReq } from '../../../app/journal-entry/dtos/transfer-transaction.dto';
import journalEntryUseCases from '../../../app/journal-entry/usecases';
import { IHttpErrorDto } from '../../../app/shared/dtos/error.dto';
import middlewares from '../middlewares';

@Route('journal-entry')
@Tags('Journal Entries')
export class JournalEntryController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/transfer')
  @OperationId('record-transfer')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async recordTransfer(@Body() body: ITransferTransactionReq) {
    return journalEntryUseCases.recordTransfer(body);
  }
}
