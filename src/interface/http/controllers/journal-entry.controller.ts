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
import { ITransactionJournalEntryReq } from '../../../app/journal-entry/dtos/transaction-journal-entry.dto';
import { IJournalEntryReq } from '../../../app/journal-entry/dtos/transaction.dto';
import journalEntryUseCases from '../../../app/journal-entry/usecases';
import { IHttpErrorDto } from '../../../app/shared/dtos/error.dto';
import middlewares from '../middlewares';

@Route('journal-entry')
@Tags('Journal Entries')
export class JournalEntryController extends Controller {
  /**
   * Create a new journal entry
   * @deprecated Use POST /journal-entry/payment or POST /journal-entry/transfer instead
   */
  @Post('/')
  @OperationId('create')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async create(@Body() body: IJournalEntryReq) {
    return journalEntryUseCases.create(body);
  }

  /**
   * Create a payment journal entry
   */
  @Post('/payment')
  @OperationId('createPayment')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createPayment(@Body() body: ITransactionJournalEntryReq) {
    return journalEntryUseCases.createPayment(body);
  }

  /**
   * Create a transfer journal entry
   */
  @Post('/transfer')
  @OperationId('createTransfer')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createTransfer(@Body() body: ITransactionJournalEntryReq) {
    return journalEntryUseCases.createTransfer(body);
  }
}
