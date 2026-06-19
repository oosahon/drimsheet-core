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
import { IJournalEntryReq } from '../../../app/journal-entry/dtos/transaction.dto';
import journalEntryUseCases from '../../../app/journal-entry/usecases';
import { IHttpErrorDto } from '../../../app/shared/dtos/error.dto';
import middlewares from '../middlewares';

@Route('journal-entry')
@Tags('Journal Entries')
export class JournalEntryController extends Controller {
  /**
   * Create a new petty cash sub account
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
}
